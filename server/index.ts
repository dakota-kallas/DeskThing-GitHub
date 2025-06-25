import {
  DESKTHING_EVENTS,
  SETTING_TYPES,
  SettingsNumber,
  SettingsString,
  SocketData,
} from "@deskthing/types";
import { DeskThing } from "@deskthing/server";
// Required export of this exact name for the server to connect
import GitHubService from "./gitHub";
import { AppSettings } from "@deskthing/types";

const start = async () => {
  const gitHub = GitHubService.getInstance();
  let Data = await DeskThing.getSettings();
  DeskThing.on(DESKTHING_EVENTS.SETTINGS, (newData) => {
    // Syncs the data with the server
    Data = newData.payload;
    if (Data) {
      gitHub.updateData(Data);
    }
  });

  // This is how to add settings (implementation may vary)
  if (!Data?.refreshInterval || !Data?.gitHubAccessToken) {
    setupSettings();
  }

  const handleGet = async (request: SocketData) => {
    if (request.request === "github_data") {
      console.log("Getting GitHub data");
      const gitHubData = await gitHub.getGitHub();
      if (gitHubData) {
        DeskThing.send({
          type: "github_data",
          payload: gitHubData,
        });
      } else {
        console.warn("Error getting GitHub data");
      }
    } else if (request.request === "github_pull_requests") {
      const ownerName = (request.payload as any)?.ownerName;
      const repoName = (request.payload as any)?.repoName;
      console.log(`Getting GitHub Pull Requests for ${ownerName}/${repoName}`);
      const pullRequests = await gitHub.getPullRequestsForRepo(
        ownerName,
        repoName
      );
      DeskThing.send({
        type: "github_pull_requests",
        payload: pullRequests,
      });
    } else if (request.request === "github_issues") {
      const ownerName = (request.payload as any)?.ownerName;
      const repoName = (request.payload as any)?.repoName;
      console.log(`Getting GitHub Issues for ${ownerName}/${repoName}`);
      const issues = await gitHub.getIssuesForRepo(ownerName, repoName);
      DeskThing.send({
        type: "github_issues",
        payload: issues,
      });
    } else if (request.request === "open_url") {
      console.log(`Opening URL: ${request.payload}`);
      DeskThing.openUrl(request.payload as string);
    }
  };

  DeskThing.on("get", handleGet);
  const stop = async () => {
    gitHub.stop();
  };
  DeskThing.on("stop", stop);
};

const setupSettings = async () => {
  DeskThing.initSettings({
    refreshInterval: {
      label: "Refresh Interval (minutes)",
      id: "refreshInterval",
      description: "The amount of minutes between each refresh.",
      type: SETTING_TYPES.NUMBER,
      value: 15,
      max: 60,
      min: 1,
    },
    gitHubAccessToken: {
      id: "gitHubAccessToken",
      label: "GitHub Access Token",
      description:
        "Your API Access Token to allow for a higher rate limit & access to your repositories. See README in the Repository for more information.",
      type: SETTING_TYPES.STRING,
      value: "",
    },
  });
};

// Main Entrypoint of the server
DeskThing.on("start", start);
