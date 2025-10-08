import {
  normalizeResourceName,
} from '../../utils';

export default (metadata, i) => ({
  Resources: {
    ...rule(metadata, i),
  },
});

const rule = (metadata, i) => ({
  [`${normalizeResourceName(metadata.function.key)}EventsRuleSchedule${i}`]: {
    Type: 'AWS::Events::Rule',
    Properties: {
      ScheduleExpression: metadata.schedule.rate,
      State: metadata.schedule.enabled === false ? 'DISABLED' : 'ENABLED',
      Name: metadata.schedule.name,
      Description: metadata.schedule.description,
      Targets: [
        {
          Input: formatInput(metadata.schedule.input),
          InputPath: metadata.schedule.inputPath,
          InputTransformer: formatInputTransformer(metadata.schedule.inputTransformer),
          Arn: {
            'Fn::GetAtt': [
              `${normalizeResourceName(metadata.function.key)}LambdaFunction`,
              'Arn',
            ],
          },
          Id: `${metadata.function.key}Schedule`,
        },
      ],
    },
  },
});

const formatInput = (input) => {
  if (input) {
    if (typeof input === 'object') {
      if (typeof input.body === 'string') {
        return JSON.stringify({
          body: JSON.parse(input.body),
        });
      }
      return JSON.stringify(input);
    } else {
      // escape quotes to favor JSON.parse
      return input.replace(/"/g, '\\"');
    }
  } else {
    return undefined;
  }
};

const formatInputTransformer = (inputTransformer) => {
  if (inputTransformer) {
    return JSON.stringify({
      InputTemplate: inputTransformer.inputTemplate,
      InputPathsMap: inputTransformer.inputPathsMap,
    });
  } else {
    return undefined;
  }
};

// "JobEventsRuleSchedule1": {
//   "Type": "AWS::Events::Rule",
//   "Properties": {
//     "ScheduleExpression": "cron(5 7 1 JAN,APR,JUL,OCT ? *)",
//     "State": "ENABLED",
//     "Targets": [
//       {
//         "Input": "{\"discriminator\":\"job-x\"}",
//         "Arn": {
//           "Fn::GetAtt": [
//             "JobLambdaFunction",
//             "Arn"
//           ]
//         },
//         "Id": "jobSchedule"
//       }
//     ]
//   }
// },
