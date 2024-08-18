import debug from 'debug';
import Promise from 'bluebird';

import Connector from './connectors/cloudformation';
import { monitorStack } from './monitor-stack';

const log = debug('cvo:deploy:cf');

export const deploy = async (plugin, convivio) => {
  const StackName = `${convivio.yaml.service}-${convivio.options.stage}`; // TODO this.provider.naming.getStackName(
  const ChangeSetName = `${StackName}-change-set`;

  const TemplateURL = convivio.yaml.provider.deploymentBucket
    ? ''
    : undefined;

  // this is just for example projects and bootstrapping <subsys>-pipeline-resources
  const TemplateBody = convivio.yaml.provider.deploymentBucket
    ? undefined
    : JSON.stringify(convivio.json);

  const connector = new Connector({ debug: log });

  // TODO validateTemplate ??? whole template ???

  const ChangeSetType = await connector.describeStacks({
    StackName,
  })
    .then(async () => {
      await connector.deleteChangeSet({
        StackName,
        ChangeSetName,
      });

      return 'UPDATE';
    })
    .catch((err) => {
      if (err.message.indexOf('does not exist') > -1) {
        return 'CREATE';
      }

      throw err;
    });

  await connector.createChangeSet({
    StackName,
    ChangeSetName,
    ChangeSetType,
    Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
    Parameters: [],
    // RoleARN: this.provider.iam?.deploymentRole,
    // Tags: Object.keys(stackTags).map((key) => ({ Key: key, Value: stackTags[key] })),
    TemplateBody,
    TemplateURL,
  });

  log('Waiting for new change set to be created');
  const changeSetDescription = await waitForChangeSetCreation(connector, ChangeSetName, StackName);

  // TODO --force ???
  if (isChangeSetWithoutChanges(changeSetDescription)) {
    await connector.deleteChangeSet({
      StackName,
      ChangeSetName,
    });
    return;
  }

  await connector.executeChangeSet({
    StackName,
    ChangeSetName,
  });

  await monitorStack(connector, ChangeSetType.toLowerCase(), changeSetDescription);
};

export const waitForChangeSetCreation = async (connector, ChangeSetName, StackName) => {
  const params = {
    ChangeSetName,
    StackName,
  };

  const callWithRetry = async () => {
    const changeSetDescription = await connector.describeChangeSet(params);
    if (
      changeSetDescription.Status === 'CREATE_COMPLETE'
      || isChangeSetWithoutChanges(changeSetDescription)
    ) {
      return changeSetDescription;
    }

    if (
      changeSetDescription.Status === 'CREATE_PENDING'
      || changeSetDescription.Status === 'CREATE_IN_PROGRESS'
    ) {
      log('Change Set did not reach desired state, retrying');
      await Promise.delay(5000);
      return callWithRetry();
    }

    throw new Error(
      `Could not create Change Set '${changeSetDescription.ChangeSetName}' due to: ${changeSetDescription.StatusReason}`,
    );
  };

  return callWithRetry();
};

export const isChangeSetWithoutChanges = (changeSetDescription) => {
  const errorMessages = [
    'No updates are to be performed.',
    'The submitted information didn\'t contain changes.',
  ];

  return (
    changeSetDescription.Status === 'FAILED'
    && errorMessages.some(
      (msg) => changeSetDescription.StatusReason && changeSetDescription.StatusReason.includes(msg),
    )
  );
};

/*
  getCreateChangeSetParams({ changeSetType, templateUrl, templateBody }) {
    let stackTags = { STAGE: this.provider.getStage() };

    // Merge additional stack tags
    if (this.serverless.service.provider.stackTags) {
      const customKeys = Object.keys(this.serverless.service.provider.stackTags);
      const collisions = Object.keys(stackTags).filter((defaultKey) =>
        customKeys.some((key) => defaultKey.toLowerCase() === key.toLowerCase())
      );

      // Delete collisions upfront
      for (const key of collisions) {
        delete stackTags[key];
      }

      stackTags = Object.assign(stackTags, this.serverless.service.provider.stackTags);
    }

    const createChangeSetParams = {

      Tags: Object.keys(stackTags).map((key) => ({ Key: key, Value: stackTags[key] })),
    };

    return createChangeSetParams;
  },
};
*/
