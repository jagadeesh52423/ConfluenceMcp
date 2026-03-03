import { JiraIssue, JiraTransitionResponse, JiraRequiredField, JiraFieldSuggestion, FieldSuggestionRule } from '../../types.js';
import { JiraBaseService } from './base.js';
import type { JiraIssueService } from './issues.js';

export class JiraTransitionService extends JiraBaseService {
  private fieldSuggestionRules: FieldSuggestionRule[] = [
    {
      pattern: /db.*script/i,
      defaultValue: 'No',
      contextRules: [
        {
          condition: (issue) => /template|config|notification|mofu/i.test(issue.summary),
          value: 'No',
          reason: 'Template/config changes are typically done via MOFU tool and do not require database scripts',
        },
      ],
    },
    {
      pattern: /test.*case|unit.*test/i,
      defaultValue: 'Yes',
      contextRules: [
        {
          condition: (issue) => /template|notification|config/i.test(issue.summary),
          value: 'No',
          reason: 'Template and configuration changes may not require separate unit test cases',
        },
      ],
    },
  ];

  constructor(
    client: ConstructorParameters<typeof JiraBaseService>[0],
    private readonly issueService: JiraIssueService
  ) {
    super(client);
  }

  async getIssueTransitions(issueKey: string): Promise<any[]> {
    const response = await this.client.get<any>(`/rest/api/3/issue/${issueKey}/transitions`);
    return response.transitions;
  }

  async transitionIssue(issueKey: string, transitionId: string, fieldValues?: Record<string, any>): Promise<JiraTransitionResponse> {
    try {
      const data: any = { transition: { id: transitionId } };
      if (fieldValues && Object.keys(fieldValues).length > 0) {
        data.fields = await this.normalizeFieldValues(issueKey, transitionId, fieldValues);
      }
      await this.client.post(`/rest/api/3/issue/${issueKey}/transitions`, data);
      return { success: true, message: `Issue ${issueKey} successfully transitioned` };
    } catch (error: any) {
      if (error.response?.status === 400) {
        const requiredFields = await this.handleTransitionError(issueKey, transitionId, error, fieldValues);
        if (requiredFields.length > 0) {
          return {
            success: false,
            requiresInput: true,
            requiredFields,
            message: 'Transition requires additional fields. Please provide values for the required fields.',
            issueKey,
            transitionId,
          };
        }
      }
      throw error;
    }
  }

  async transitionIssueInteractive(issueKey: string, transitionId: string, providedFields?: Record<string, any>): Promise<JiraTransitionResponse> {
    const result = await this.transitionIssue(issueKey, transitionId, providedFields);
    if (result.success || !result.requiresInput) return result;

    if (result.requiredFields && result.requiredFields.length > 0) {
      const autoFields: Record<string, any> = { ...providedFields };
      const autoFilledNames: string[] = [];
      for (const field of result.requiredFields) {
        if (field.suggestion) {
          autoFields[field.key] = field.suggestion.id ? { id: field.suggestion.id } : field.suggestion.value;
          autoFilledNames.push(`${field.name}="${field.suggestion.value}"`);
        }
      }
      if (autoFilledNames.length > 0) {
        const retryResult = await this.transitionIssue(issueKey, transitionId, autoFields);
        if (retryResult.success) {
          retryResult.message = `${retryResult.message} (auto-filled: ${autoFilledNames.join(', ')})`;
        }
        return retryResult;
      }
    }
    return result;
  }

  private async normalizeFieldValues(
    issueKey: string,
    transitionId: string,
    fieldValues: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const response = await this.client.get<any>(
        `/rest/api/3/issue/${issueKey}/transitions`,
        { expand: 'transitions.fields' }
      );
      const transition = response.transitions?.find((t: any) => t.id === transitionId);
      if (!transition?.fields) return fieldValues;

      const normalized: Record<string, any> = {};
      for (const [key, value] of Object.entries(fieldValues)) {
        const fieldMeta = transition.fields[key];
        if (!fieldMeta?.allowedValues || !Array.isArray(fieldMeta.allowedValues)) {
          normalized[key] = value;
          continue;
        }
        const allowedValues: Array<{ id: string; value: string }> = fieldMeta.allowedValues;
        if (typeof value === 'string') {
          const match = allowedValues.find(
            opt => opt.value?.toLowerCase() === value.toLowerCase() ||
                   (opt as any).name?.toLowerCase() === value.toLowerCase()
          );
          normalized[key] = match ? { id: match.id } : value;
        } else if (typeof value === 'object' && value !== null) {
          if (value.id) {
            const match = allowedValues.find(opt => opt.id === value.id);
            normalized[key] = match ? { id: match.id } : value;
          } else if (value.value) {
            const match = allowedValues.find(
              opt => opt.value?.toLowerCase() === value.value.toLowerCase() ||
                     (opt as any).name?.toLowerCase() === value.value.toLowerCase()
            );
            normalized[key] = match ? { id: match.id } : value;
          } else {
            normalized[key] = value;
          }
        } else {
          normalized[key] = value;
        }
      }
      return normalized;
    } catch {
      return fieldValues;
    }
  }

  private async handleTransitionError(
    issueKey: string,
    transitionId: string,
    error: any,
    providedFieldValues?: Record<string, any>
  ): Promise<JiraRequiredField[]> {
    try {
      const response = await this.client.get<any>(
        `/rest/api/3/issue/${issueKey}/transitions`,
        { expand: 'transitions.fields' }
      );
      const transition = response.transitions?.find((t: any) => t.id === transitionId);
      if (!transition || !transition.fields) return [];

      const issue = await this.issueService.getIssue(issueKey);

      const errorFields = new Set<string>();
      const errorData = error.response?.data;
      if (errorData?.errors) {
        for (const key of Object.keys(errorData.errors)) errorFields.add(key);
      }

      const requiredFields: JiraRequiredField[] = [];
      const providedKeys = new Set(Object.keys(providedFieldValues || {}));

      for (const [fieldKey, fieldInfo] of Object.entries(transition.fields) as [string, any][]) {
        const isRequired = fieldInfo.required === true;
        const isErrorField = errorFields.has(fieldKey);
        const wasProvided = providedKeys.has(fieldKey);
        if ((isRequired && !wasProvided) || isErrorField) {
          requiredFields.push(this.analyzeField(fieldKey, fieldInfo, issue));
        }
      }
      return requiredFields;
    } catch (err) {
      console.error('Error analyzing transition fields:', err);
      return [];
    }
  }

  private analyzeField(fieldKey: string, fieldInfo: any, issue: JiraIssue): JiraRequiredField {
    const field: JiraRequiredField = {
      key: fieldKey,
      name: fieldInfo.name || fieldKey,
      type: fieldInfo.schema?.type || 'unknown',
      required: fieldInfo.required || false,
    };
    if (fieldInfo.allowedValues) {
      field.options = fieldInfo.allowedValues.map((val: any) => ({ id: val.id, value: val.value }));
    }
    field.suggestion = this.generateFieldSuggestion(fieldInfo.name, field.options, issue);
    return field;
  }

  private generateFieldSuggestion(fieldName: string, options?: any[], issue?: JiraIssue): JiraFieldSuggestion | undefined {
    if (!fieldName) return undefined;
    for (const rule of this.fieldSuggestionRules) {
      if (rule.pattern.test(fieldName)) {
        if (rule.contextRules && issue) {
          for (const contextRule of rule.contextRules) {
            if (contextRule.condition(issue)) {
              const matchingOption = options?.find(opt => opt.value === contextRule.value);
              return { value: contextRule.value, id: matchingOption?.id, reason: contextRule.reason };
            }
          }
        }
        const matchingOption = options?.find(opt => opt.value === rule.defaultValue);
        return { value: rule.defaultValue, id: matchingOption?.id, reason: `Default suggestion for ${fieldName.toLowerCase()}` };
      }
    }
    if (options && options.length > 0) {
      if (/required|mandatory|needed/i.test(fieldName)) {
        const yesOption = options.find(opt => /yes|true|required/i.test(opt.value));
        if (yesOption) return { value: yesOption.value, id: yesOption.id, reason: 'Field name suggests this is typically required' };
      }
      if (/optional|not.*required|skip/i.test(fieldName)) {
        const noOption = options.find(opt => /no|false|not.*required|skip/i.test(opt.value));
        if (noOption) return { value: noOption.value, id: noOption.id, reason: 'Field name suggests this is typically not required' };
      }
    }
    return undefined;
  }
}
