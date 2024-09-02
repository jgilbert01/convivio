import {
  normalizeResourceName,
} from '../utils';

export default (metadata, convivio) => ({
  Resources: {
    [`${normalizeResourceName(metadata.key)}LogGroup`]: {
      Type: 'AWS::Lambda::LogGroup',
      Properties: {
        LogGroupName: `/aws/lambda/${convivio.yaml.service}-${convivio.options.stage}-${metadata.key}`,
        RetentionInDays: convivio.yaml.provider.logRetentionInDays,

        // DataProtectionPolicy : Json,
        // KmsKeyId : String,
        // LogGroupClass : String,
        // Tags : [ Tag, ... ]
      },
    },
  },
});
