import crypto from 'crypto';

import {
  normalizeResourceName,
} from '../../utils';

const healthCheckDefaults = {
  HealthCheckEnabled: false,
  HealthCheckPath: '/',
  HealthCheckIntervalSeconds: 35,
  HealthCheckTimeoutSeconds: 30,
  HealthyThresholdCount: 5,
  UnhealthyThresholdCount: 5,
  Matcher: { HttpCode: '200' },
};

const REGEX = new RegExp(
  '^arn:aws[\\w-]*:elasticloadbalancing:.+:listener\\/app\\/[\\w-]+\\/([\\w-]+)\\/([\\w-]+)$',
);

export default (metadata, convivio, ctx) => {
  ctx.functionName = normalizeResourceName(metadata.function.key);
  const matches = metadata.alb.listenerArn.match(REGEX);
  ctx.albId = matches[1];
  ctx.listenerId = matches[2];
  ctx.multiValueHeaders = metadata.alb.multiValueHeaders ? 'MultiValue' : '';
  ctx.logicalId = `${ctx.functionName}Alb${ctx.multiValueHeaders}TargetGroup${ctx.albId}`;
  ctx.registerTargetPermissionLogicalId = `${ctx.functionName}LambdaPermissionRegisterTarget`;
  ctx.albTargetGroupLogicalId = `${ctx.functionName}Alb${ctx.multiValueHeaders}TargetGroup${ctx.albId}`;
  ctx.albTargetGroupNameTagValue = `${convivio.yaml.service}-${metadata.function.key}-${ctx.albId}-${ctx.multiValueHeaders}${convivio.options.stage}`;

  const hash = crypto
    .createHash('md5')
    .update(ctx.albTargetGroupNameTagValue)
    .digest('hex');

  ctx.albTargetGroupName = `${convivio.yaml.provider.alb?.targetGroupPrefix || ''}${hash}`.slice(0, 32);
  ctx.albListenerRuleLogicalId = `${ctx.functionName}AlbListenerRule${metadata.alb.priority}`;

  return {
    Resources: {
      [ctx.logicalId]: {
        Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
        DependsOn: [ctx.registerTargetPermissionLogicalId],
        Properties: {
          TargetType: 'lambda',
          Targets: [{
            Id: {
              'Fn::GetAtt': [
                `${ctx.functionName}LambdaFunction`,
                'Arn',
              ],
            },
          }],
          Name: metadata.alb.targetGroupName || ctx.albTargetGroupName,
          Tags: [{
            Key: 'Name',
            Value: ctx.albTargetGroupNameTagValue,
          }],
          TargetGroupAttributes: [{
            Key: 'lambda.multi_value_headers.enabled',
            Value: metadata.alb.multiValueHeaders || false,
          }],

          ...healthCheckDefaults,
        },
      },
    },
  };
};
