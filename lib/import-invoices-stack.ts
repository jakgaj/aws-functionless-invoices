import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as states from 'aws-cdk-lib/aws-stepfunctions';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ImportInvoicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const regions = this.node.tryGetContext('regions');

    // EventBridge event bus
    const bus = new events.EventBus(this, 'InvoicesBus1', {
      eventBusName: 'Invoices'
    });

    // Step Functions state machine
    const machine = new states.StateMachine(this, 'ImportStateMachine', {
      stateMachineName: 'ImportInvoices',
      definitionBody: states.DefinitionBody.fromFile('src/state-machines/import-invoices-sm.yaml'),
      timeout: cdk.Duration.minutes(5),
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'ImportStateMachineLogs', {
          logGroupName: '/aws/states/ImportInvoices',
          removalPolicy: cdk.RemovalPolicy.DESTROY
        }),
        level: states.LogLevel.ALL,
      }
    });

    // EventBridge event rule to trigger state machine
    new events.Rule(this, 'ImportInvoicesRule', {
      ruleName: 'ImportInvoices',
      description: 'Start execution of state machine ImportInvoices',
      eventBus: bus,
      eventPattern: {
        source: [ "ImportInvoices" ],
        detailType: [ "StartImport" ]
      },
      enabled: true,
      targets: [
        new targets.SfnStateMachine(machine, {
          input: events.RuleTargetInput.fromObject({})
        })
      ]
    });

    // EventBridge event rule to send events to secondary event bus
    new events.Rule(this, 'NewInvoiceRule', {
      ruleName: 'NewInvoiceImported',
      description: 'Send events to event bus in secondary region',
      eventPattern: {
        source: [ "ImportInvoices" ],
        detailType: [ "NewInvoiceImported" ]
      },
      enabled: true,
      targets: [
        new targets.EventBus(
          events.EventBus.fromEventBusArn(this, 'InvoicesBus2', 
            `arn:aws:events:${regions.secondary}:${this.account}:event-bus/Invoices`
          )
        )
      ]
    });

  }
}
