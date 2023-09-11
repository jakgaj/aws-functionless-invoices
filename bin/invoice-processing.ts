#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SharedResourcesStack } from '../lib/shared-resources-stack';
import { ImportInvoicesStack } from '../lib/import-invoices-stack';
import { EnrichInvoicesStack } from '../lib/enrich-invoices-stack';

const app = new cdk.App();
const regions = app.node.tryGetContext('regions');

const sharedStack = new SharedResourcesStack(app, 'SharedResourcesStack', {
  env: { region: regions.shared },
});

const importStack = new ImportInvoicesStack(app, 'ImportInvoicesStack', {
  env: { region: regions.import },
});

const enrichStack = new EnrichInvoicesStack(app, 'EnrichInvoicesStack', {
  env: { region: regions.enrich },
});

importStack.addDependency(sharedStack);
enrichStack.addDependency(sharedStack);
