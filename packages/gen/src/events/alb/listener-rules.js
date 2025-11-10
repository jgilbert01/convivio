const toArray = (v) => (Array.isArray(v) ? v : [v]);

export default (metadata, convivio, ctx) => {
  // let Order = 0;
  const Actions = [];
  const forwardAction = {
    Type: 'forward',
    TargetGroupArn: {
      Ref: ctx.albTargetGroupLogicalId,
    },
  };
  // if (Order) {
  //   forwardAction.Order = ++Order;
  // }
  Actions.push(forwardAction);

  const Conditions = [];
  if (metadata.alb.conditions.path) {
    Conditions.push({
      Field: 'path-pattern',
      Values: toArray(metadata.alb.conditions.path),
    });
  }
  if (metadata.alb.conditions.host) {
    Conditions.push({
      Field: 'host-header',
      HostHeaderConfig: {
        Values: toArray(metadata.alb.conditions.host),
      },
    });
  }
  if (metadata.alb.conditions.method) {
    Conditions.push({
      Field: 'http-request-method',
      HttpRequestMethodConfig: {
        Values: toArray(metadata.alb.conditions.method),
      },
    });
  }
  if (metadata.alb.conditions.header) {
    Conditions.push({
      Field: 'http-header',
      HttpHeaderConfig: {
        HttpHeaderName: metadata.alb.conditions.header.name,
        Values: metadata.alb.conditions.header.values,
      },
    });
  }
  if (metadata.alb.conditions.query) {
    Conditions.push({
      Field: 'query-string',
      QueryStringConfig: {
        Values: Object.keys(metadata.alb.conditions.query).map((key) => ({
          Key: key,
          Value: metadata.alb.conditions.query[key],
        })),
      },
    });
  }
  if (metadata.alb.conditions.ip) {
    Conditions.push({
      Field: 'source-ip',
      SourceIpConfig: {
        Values: toArray(metadata.alb.conditions.ip),
      },
    });
  }

  return {
    Resources: {
      [ctx.albListenerRuleLogicalId]: {
        Type: 'AWS::ElasticLoadBalancingV2::ListenerRule',
        Properties: {
          Actions,
          Conditions,
          ListenerArn: metadata.alb.listenerArn,
          Priority: metadata.alb.priority,
        },
      },
    },
  };
};
