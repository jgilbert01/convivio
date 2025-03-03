import debug from 'debug';
import Promise from 'bluebird';

const log = debug('cvo:deploy:cf');

const validStatuses = new Set(['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'DELETE_COMPLETE']);

const normalizerPattern = /(?<!^)([A-Z])/g;
const resourceTypePattern = /^(?<domain>[^:]+)::(?<service>[^:]+)(?:::(?<method>.+))?$/;
const resourceTypeToErrorCodePostfix = (resourceType) => {
  const { domain, service, method } = resourceType.match(resourceTypePattern).groups;
  if (domain !== 'AWS') return `_${domain.replace(normalizerPattern, '_$1').toUpperCase()}`;
  return `_${service.replace(normalizerPattern, '_$1')}_${method.replace(
    normalizerPattern,
    '_$1',
  )}`.toUpperCase();
};

export const checkStackProgress = async (
  connector,
  progress,
  action,
  cfData,
  stackUrl,
  options,
  {
    loggedEventIds = new Set(),
    stackStatus = null,
    stackLatestError = null,
    firstEventId = null,
    completedResources = new Set(),
  },
) => Promise.delay(5000)
  .then(() =>
    connector
      .describeStackEvents({ StackName: cfData.StackId })
      .then(
        ({ StackEvents: stackEvents }) => {
          if (!stackEvents.length) return;

          // Resolve only events applicable to current deployment
          stackEvents.some((event, index) => {
            if (firstEventId) {
              if (event.EventId !== firstEventId) return false;
            } else {
              if (event.ResourceType !== 'AWS::CloudFormation::Stack') return false;
              if (event.ResourceStatus !== `${action.toUpperCase()}_IN_PROGRESS`) return false;
              firstEventId = event.EventId;
            }
            stackEvents = stackEvents.slice(0, index + 1);
            return true;
          });
          stackEvents.reverse();

          // Loop through stack events
          stackEvents.forEach((event) => {
            if (loggedEventIds.has(event.EventId)) return;
            const eventStatus = event.ResourceStatus || null;
            // Keep track of stack status
            if (
              event.ResourceType === 'AWS::CloudFormation::Stack'
                  && event.StackName === event.LogicalResourceId
            ) {
              stackStatus = eventStatus;
            }
            // Keep track of first failed event
            if (
              eventStatus
                  && (eventStatus.endsWith('FAILED')
                    || eventStatus === 'UPDATE_ROLLBACK_IN_PROGRESS')
                  && stackLatestError === null
            ) {
              stackLatestError = event;
            }
            // Log stack events
            progress.updateProgress(`  ${eventStatus} - ${event.ResourceType} - ${event.LogicalResourceId}`);

            if (
              event.ResourceType !== 'AWS::CloudFormation::Stack'
                  && eventStatus
                  && eventStatus.endsWith('COMPLETE')
            ) {
              completedResources.add(event.LogicalResourceId);
            }

            if (action !== 'delete' && cfData.Changes) {
              const progressMessagePrefix = (() => {
                if (action === 'create') return 'Creating';
                if (action === 'update') return 'Updating';
                throw new Error(`Unrecgonized action: ${action}`);
              })();
              progress.updateProgress(`${progressMessagePrefix} CloudFormation stack (${completedResources.size}/${cfData.Changes.length})`);
            }

            // Prepare for next monitoring action
            loggedEventIds.add(event.EventId);
          });
          // Handle stack create/update/delete failures
          if (
            stackLatestError
                && (!options.verbose
                  || (stackStatus
                    && (stackStatus.endsWith('ROLLBACK_COMPLETE')
                      || ['DELETE_FAILED', 'DELETE_COMPLETE'].includes(stackStatus))))
          ) {
            const decoratedErrorMessage = `${stackLatestError.ResourceStatus}: ${stackLatestError.LogicalResourceId
            } ${(`${stackLatestError.ResourceType}`)}\n${stackLatestError.ResourceStatusReason
            }\n\n${(`View the full error: ${stackUrl}`)}`;

            let errorMessage = 'An error occurred: ';
            errorMessage += `${stackLatestError.LogicalResourceId} - `;
            errorMessage += `${stackLatestError.ResourceStatusReason || stackLatestError.ResourceStatus
            }.`;
            const errorCode = (() => {
              if (stackLatestError.ResourceStatusReason) {
                if (
                  stackLatestError.ResourceStatusReason.startsWith(
                    'Properties validation failed',
                  )
                ) {
                  return `AWS_CLOUD_FORMATION_${action.toUpperCase()}_STACK_INTERNAL_VALIDATION_ERROR`;
                }
                if (
                  stackLatestError.ResourceStatusReason.includes('is not authorized to perform')
                ) {
                  return `AWS_CLOUD_FORMATION_${action.toUpperCase()}_STACK_INTERNAL_INSUFFICIENT_PERMISSIONS`;
                }
              }
              return (
                `AWS_CLOUD_FORMATION_${action.toUpperCase()}_STACK_INTERNAL`
                    + `${resourceTypeToErrorCodePostfix(stackLatestError.ResourceType)}_${stackLatestError.ResourceStatus
                    }`
              );
            })();
            throw new Error(errorMessage, errorCode, {
              decoratedMessage: decoratedErrorMessage,
            });
          }
        },
        (e) => {
          if (action === 'delete' && e.message.includes('does not exist')) {
            stackStatus = 'DELETE_COMPLETE';
            return;
          }
          throw e;
        },
      ))
  .then(() => {
    if (validStatuses.has(stackStatus)) return stackStatus;
    return checkStackProgress(connector, progress, action, cfData, stackUrl, options, {
      loggedEventIds,
      stackStatus,
      stackLatestError,
      firstEventId,
      completedResources,
    });
  });

export const monitorStack = async (connector, progress, action, cfData, options = {}) => {
  // Skip monitoring if stack was already created
  if (cfData === 'alreadyCreated') return Promise.resolve();

  const { region } = options;
  const baseCfUrl = `https://${region}.console.aws.amazon.com/cloudformation/home`;
  const encodedStackId = `${encodeURIComponent(cfData.StackId)}`;
  const cfQueryString = `region=${region}#/stack/detail?stackId=${encodedStackId}`;
  const stackUrl = `${baseCfUrl}?${cfQueryString}`;

  return checkStackProgress(connector, progress, action, cfData, stackUrl, options, {});
};
