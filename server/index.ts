import {
  DeskThing as DK,
  SettingsNumber,
  SettingsString,
  SocketData,
} from 'deskthing-server';
const DeskThing = DK.getInstance();
export { DeskThing }; // Required export of this exact name for the server to connect
import GitHubService from './gitHub';

const start = async () => {
  const gitHub = GitHubService.getInstance();
  let Data = await DeskThing.getData();
  DeskThing.on('data', (newData) => {
    // Syncs the data with the server
    Data = newData;
    if (Data) {
      gitHub.updateData(Data);
    }
  });

  // This is how to add settings (implementation may vary)
  if (!Data?.settings?.refreshInterval) {
    setupSettings();
  }

  const handleGet = async (request: SocketData) => {
    if (request.request === 'github_data') {
      DeskThing.sendLog('Getting GitHub data');
      const gitHubData = await gitHub.getGitHub();
      if (gitHubData) {
        DeskThing.sendDataToClient({
          type: 'github_data',
          payload: gitHubData,
        });
      } else {
        console.warn('Error getting GitHub data');
      }
    }
  };

  DeskThing.on('get', handleGet);
  const stop = async () => {
    gitHub.stop();
  };
  DeskThing.on('stop', stop);
};

const setupSettings = async () => {
  const refreshInterval: SettingsNumber = {
    label: 'Refresh Interval (minutes)',
    description: 'The amount of minutes between each refresh.',
    type: 'number',
    value: 5,
    max: 60,
    min: 1,
  };

  const gitHubAccessToken: SettingsString = {
    label: 'GitHub Access Token',
    description:
      '(Optional) You API Access Token to allow for a higher rate limit & access to private repositories.',
    type: 'string',
    value: '',
  };

  DeskThing.addSettings({
    refreshInterval,
    gitHubAccessToken,
  });
};

// Main Entrypoint of the server
DeskThing.on('start', start);
