import { DeskThing } from './index';
import { DataInterface } from 'deskthing-server';
import {
  GitHubData,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRepo,
  GitHubUser,
} from '../src/stores/gitHubStore';

class GitHubService {
  private gitHubData: GitHubData;
  private lastUpdateTime: Date | null;
  private updateTaskId: (() => void) | null = null;
  private deskthing: typeof DeskThing;
  private static instance: GitHubService | null = null;
  private refreshInterval: number = 5;
  private gitHubAccessToken: string | null = null;

  constructor() {
    this.deskthing = DeskThing;
    this.updateGitHub();
    this.scheduleIntervalUpdates();
  }

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  private async updateGitHub() {
    this.deskthing.sendLog(`Fetching GitHub data...`);

    // TODO: Remove this check
    if (this.gitHubData?.repository) {
      this.deskthing.sendLog('No need to fetch data...');
    } else {
      this.deskthing.sendLog('Actually fetching...');
      this.gitHubData = {} as GitHubData;
      this.gitHubData.repository = await this.getGitHubRepo(
        'itsriprod/deskthing'
      );
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // Use 12-hour format (AM/PM)
    });
    this.lastUpdateTime = now;
    this.gitHubData.lastUpdated = timeString;

    this.deskthing.sendLog(`GitHub updated`);
    this.deskthing.sendDataToClient({
      type: 'github_data',
      payload: this.gitHubData,
    });
  }

  private scheduleIntervalUpdates() {
    if (this.updateTaskId) {
      this.updateTaskId();
    }
    this.updateTaskId = DeskThing.addBackgroundTaskLoop(async () => {
      this.updateGitHub();
      const interval = this.refreshInterval > 0 ? this.refreshInterval : 1;
      await this.sleep(interval * 60 * 1000);
    }); // Update every set amount of minutes
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public updateData(data: DataInterface) {
    if (!data.settings) {
      this.deskthing.sendLog('No settings defined');
      return;
    }
    try {
      this.deskthing.sendLog('Updating settings...');
      this.refreshInterval =
        (data.settings.refreshInterval.value as number) || 5;
      this.gitHubAccessToken =
        (data.settings.gitHubAccessToken.value as string) || null;
      this.updateGitHub();
    } catch (error) {
      this.deskthing.sendLog('Error updating GitHub data: ' + error);
    }
  }

  async stop() {
    this.lastUpdateTime = null;
  }

  public async getGitHub(): Promise<GitHubData> {
    // If it's been more than an hour since the last update, update the GitHub data
    if (
      !this.lastUpdateTime ||
      new Date().getTime() - this.lastUpdateTime.getTime() > 15 * 60 * 1000
    ) {
      DeskThing.sendLog('Fetching GitHub data...');
      await this.updateGitHub();
    }
    DeskThing.sendLog('Returning GitHub data');
    return this.gitHubData;
  }

  private async getGitHubRepo(path: string) {
    try {
      const headers: HeadersInit = {};

      if (this.gitHubAccessToken) {
        headers.Authorization = `Bearer ${this.gitHubAccessToken}`;
      }

      const response = await fetch(`https://api.github.com/repos/${path}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      const user: GitHubUser = {
        id: data.owner.id,
        username: data.owner.login,
        avatarUrl: data.owner.avatar_url,
        url: data.owner.html_url,
      };

      const repo: GitHubRepo = {
        id: data.id,
        fullName: data.full_name,
        name: data.name,
        description: data.description,
        stars: data.stargazers_count,
        watchers: data.watchers_count,
        forks: data.forks_count,
        defaultBranch: data.default_branch,
        updatedAt: data.updated_at,
        createdAt: data.created_at,
        pushedAt: data.pushed_at,
        language: data.language,
        archived: data.archived,
        disabled: data.disabled,
        visibility: data.visibility,
        openIssues: data.open_issues_count,
        private: data.private,
        fork: data.fork,
        size: data.size,
        url: data.html_url,
        owner: user,
        pullRequests: [],
        issues: [],
      };

      // Fill in the Pull Requests
      if (data.pulls_url) {
        try {
          const pullsResponse = await fetch(
            data.pulls_url.replace('{/number}', ''),
            {
              method: 'GET',
              headers,
            }
          );

          if (!pullsResponse.ok) {
            throw new Error(
              `Status ${pullsResponse.status} - ${pullsResponse.statusText}`
            );
          }

          const pullsData = await pullsResponse.json();

          for (let pull of pullsData) {
            const user: GitHubUser = {
              id: pull.user.id,
              username: pull.user.login,
              avatarUrl: pull.user.avatar_url,
              url: pull.user.html_url,
            };

            const pullRequest: GitHubPullRequest = {
              id: pull.id,
              title: pull.title,
              state: pull.state,
              locked: pull.locked,
              user,
              body: pull.body,
              createdAt: pull.created_at,
              updatedAt: pull.updated_at,
              closedAt: pull.closed_at,
              mergedAt: pull.merged_at,
              draft: pull.draft,
              baseBranch: pull.base.label,
              headBranch: pull.head.label,
            };

            repo.pullRequests!.push(pullRequest);
          }
        } catch (error) {
          repo.pullRequests = undefined;
          this.deskthing.sendLog(
            'Error fetching GitHub pull requests: ' + error
          );
        }

        // Fill in the Issues
        if (data.issues_url) {
          try {
            const issuesResponse = await fetch(
              data.issues_url.replace('{/number}', ''),
              {
                method: 'GET',
                headers,
              }
            );

            if (!issuesResponse.ok) {
              throw new Error(
                `Status ${issuesResponse.status} - ${issuesResponse.statusText}`
              );
            }

            const issuesData = await issuesResponse.json();

            for (let issue of issuesData) {
              const user: GitHubUser = {
                id: issue.user.id,
                username: issue.user.login,
                avatarUrl: issue.user.avatar_url,
                url: issue.user.html_url,
              };

              const gitHubIssue: GitHubIssue = {
                id: issue.id,
                title: issue.title,
                state: issue.state,
                locked: issue.locked,
                user,
                body: issue.body,
                createdAt: issue.created_at,
                updatedAt: issue.updated_at,
                closedAt: issue.closed_at,
              };

              repo.issues!.push(gitHubIssue);
            }
          } catch (error) {
            repo.issues = undefined;
            this.deskthing.sendLog('Error fetching GitHub issues: ' + error);
          }
        }
      }

      return repo;
    } catch (error) {
      this.deskthing.sendLog('Error fetching GitHub data: ' + error);
      return undefined;
    }
  }
}

export default GitHubService;
