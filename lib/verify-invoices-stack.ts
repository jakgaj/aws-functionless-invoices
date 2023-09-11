import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as states from 'aws-cdk-lib/aws-stepfunctions';
import * as logs from 'aws-cdk-lib/aws-logs';

export class VerifyInvoicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // EventBridge event bus
    const bus = new events.EventBus(this, 'InvoicesBus2', {
      eventBusName: 'Invoices'
    });

    // Step Functions state machine
    const machine = new states.StateMachine(this, 'VerifyStateMachine', {
      stateMachineName: 'VerifyInvoices',
      definitionBody: states.DefinitionBody.fromFile('src/state-machines/verify-invoices-sm.yaml'),
      timeout: cdk.Duration.minutes(5),
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'VerifyStateMachineLogs', {
          logGroupName: '/aws/states/VerifyInvoices',
          removalPolicy: cdk.RemovalPolicy.DESTROY
        }),
        level: states.LogLevel.ALL,
      }
    });

    // EventBridge event rule to trigger state machine
    new events.Rule(this, 'VerifyInvoicesRule', {
      ruleName: 'VerifyInvoices',
      description: 'Start execution of state machine VerifyInvoices',
      eventBus: bus,
      eventPattern: {
        source: [ "ImportInvoices" ],
        detailType: [ "NewInvoiceImported" ]
      },
      enabled: true,
      targets: [
        // Step Functions state machine
        new targets.SfnStateMachine(machine, {
          input: events.RuleTargetInput.fromEventPath('$.detail')
        }),
        // CloudWatch log group
        new targets.CloudWatchLogGroup(
          new logs.LogGroup(this, 'VerifyEventsLogGroup', {
            logGroupName: '/aws/events/VerifyInvoices',
            removalPolicy: cdk.RemovalPolicy.DESTROY
          })
        )
      ]
    });

  }
}
