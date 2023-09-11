import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as states from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ImportInvoicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // EventBridge event bus
    const bus = new events.EventBus(this, 'InvoicesBus', {
      eventBusName: 'Invoices'
    });

    const machine = new states.StateMachine(this, 'ImportStateMachine', {
      stateMachineName: 'ImportInvoices',
      definitionBody: states.DefinitionBody.fromFile('src/import-invoices-sm.yaml'),
      timeout: cdk.Duration.minutes(5),
      logs: {
        destination: new logs.LogGroup(this, 'ImportStateMachineLogs', {
          logGroupName: '/aws/vendedlogs/states/ImportInvoices'
        }),
        level: states.LogLevel.ALL,
      },
      tracingEnabled: true,
      // definition: states.Chain
      //   .start(new tasks.CallAwsService(this, 'GetConfig', {
      //     service: 'ssm',
      //     action: 'getParameters',
      //     iamResources: ['*'],
      //     additionalIamStatements: [],
      //     parameters: {
      //       'Names': [
      //         '/invoices/config/bucketName',
      //         '/invoices/config/jsonKey'
      //       ]
      //     },
      //     resultSelector: {
      //       'bucketName.$': '$.Parameters[0].Value',
      //       'bucketKey.$': '$.Parameters[1].Value'
      //     }
      //   }))
    });

  }
}
