import { DeskThing } from './index';
import { DataInterface } from 'deskthing-server';
import {
  GitHubData,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRepo,
  GitHubUser,
} from '../src/stores/gitHubStore';
import { Octokit } from '@octokit/rest';

class GitHubService {
  private gitHubData: GitHubData = {};
  private lastUpdateTime: Date | null;
  private updateTaskId: (() => void) | null = null;
  private deskthing: typeof DeskThing;
  private static instance: GitHubService | null = null;
  private refreshInterval: number = 5;
  private gitHubAccessToken: string | null = null;
  private lastModifiedRequest: string | null = null;

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

    // Setup GitHub API Requests
    const octokit = new Octokit({
      auth: this.gitHubAccessToken || '',
    });

    await this.fillMyRepositories(octokit);

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

  private async fillMyRepositories(octokit: Octokit) {
    try {
      const requestHeaders: Record<string, string> = {};
      if (this.lastModifiedRequest) {
        requestHeaders['If-Modified-Since'] = this.lastModifiedRequest;
      }

      const { data, headers, status } =
        await octokit.repos.listForAuthenticatedUser({ requestHeaders });

      if (headers['x-ratelimit-remaining'] === '0') {
        this.deskthing.sendLog('Rate limit reached');
        return;
      }

      // Check if the data has been modified
      if ((status as number) === 304) {
        this.deskthing.sendLog('No updates to repositories');
        return;
      }

      if ((status as number) !== 200) {
        this.deskthing.sendLog(`Unexpected status: ${status}`);
        return;
      }

      this.lastModifiedRequest = headers['last-modified'] ?? null;

      const myRepos: GitHubRepo[] = [];

      for (const repo of data) {
        const user: GitHubUser = {
          id: repo.owner.id,
          username: repo.owner.login,
          avatarUrl: await this.deskthing.encodeImageFromUrl(
            repo.owner.avatar_url
          ),
          url: repo.owner.html_url,
        };

        const myRepo: GitHubRepo = {
          id: repo.id,
          fullName: repo.full_name,
          name: repo.name,
          description: repo.description,
          stars: repo.stargazers_count,
          watchers: repo.watchers_count,
          forks: repo.forks_count,
          defaultBranch: repo.default_branch,
          updatedAt: repo.updated_at,
          createdAt: repo.created_at,
          pushedAt: repo.pushed_at,
          language: repo.language,
          archived: repo.archived,
          disabled: repo.disabled,
          visibility: repo.visibility,
          openIssues: repo.open_issues_count,
          private: repo.private,
          fork: repo.fork,
          size: repo.size,
          url: repo.html_url,
          owner: user,
        };

        myRepos.push(myRepo);
      }

      this.gitHubData.myRepositories = myRepos;
    } catch (error) {
      this.deskthing.sendLog('Error fetching repositories: ' + error);
    }
  }

  public async getPullRequestsForRepo(ownerName: string, repoName: string) {
    const octokit = new Octokit({
      auth: this.gitHubAccessToken || '',
    });

    const { headers, status, data } = await octokit.pulls.list({
      owner: ownerName,
      repo: repoName,
      state: 'all', // Can be "open", "closed", or "all"
      per_page: 100, // Number of results per page (max 100)
    });

    if (headers['x-ratelimit-remaining'] === '0') {
      this.deskthing.sendLog('Rate limit reached');
      return;
    }

    if (status !== 200) {
      return;
    }

    const pullRequests: GitHubPullRequest[] = [];

    data.forEach((pull) => {
      const pullRequest: GitHubPullRequest = {
        id: pull.id,
        number: pull.number,
        title: pull.title,
        state: pull.state,
        locked: pull.locked,
        body: pull.body,
        createdAt: pull.created_at,
        updatedAt: pull.updated_at,
        closedAt: pull.closed_at,
        mergedAt: pull.merged_at,
        draft: pull.draft ?? false,
        baseBranch: pull.base.label,
        headBranch: pull.head.label,
      };

      if (pull.user) {
        const user: GitHubUser = {
          id: pull.user.id,
          username: pull.user.login,
          avatarUrl: pull.user.avatar_url,
          url: pull.user.html_url,
        };

        pullRequest.user = user;
      }

      pullRequests.push(pullRequest);
    });

    return pullRequests;
  }
}

export default GitHubService;
