import * as vscode from 'vscode';
import FaunaDBSchemaProvider from './FaunaDBSchemaProvider';
import FQLContentProvider from './FQLContentProvider';
import createRunQueryCommand from './runQueryCommand';
import createCreateQueryCommand from './createQueryCommand';
import { getLocalKey } from "./auth";

export function activate(context: vscode.ExtensionContext) {
  // Set output channel to display FQL results
  const outputChannel = vscode.window.createOutputChannel('FQL');

  // Set FQL Document Content Provider
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      'fqlcode',
      new FQLContentProvider()
    )
  );

  // Check if there is a secret key
  const config = vscode.workspace.getConfiguration('faunadb');
  let adminSecretKey = config.get<string>('adminSecretKey');
  
  // Load a local key if there is (in a .faunarc file set as FAUNA_KEY=<your-secret>)
  let localSecretKey = getLocalKey();
  if(localSecretKey) {
    adminSecretKey = localSecretKey;
  }

  if (!adminSecretKey) {
    vscode.window.showErrorMessage(
      'No FaunaDB admin secret key was found on Code > Preferences > Settings > Extensions > FaunaDB.'
    );
    return;
  }

  // Set Schema Provider to display items on sidebar
  const faunaDBSchemaProvider = new FaunaDBSchemaProvider(adminSecretKey);
  vscode.window.registerTreeDataProvider(
    'faunadb-databases',
    faunaDBSchemaProvider
  );

  vscode.commands.registerCommand(
    'faunadb.runQuery',
    createRunQueryCommand(adminSecretKey, outputChannel)
  );

  vscode.commands.registerCommand(
    'faunadb.createQuery',
    createCreateQueryCommand()
  );

  vscode.commands.registerCommand('faunadb.get', item => {
    item.displayInfo();
  });

  vscode.commands.registerCommand('faunadb.refreshEntry', () =>
    faunaDBSchemaProvider.refresh()
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
