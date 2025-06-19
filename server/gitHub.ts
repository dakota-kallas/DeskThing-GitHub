import { DeskThing } from '@deskthing/server';
import {
  GitHubData,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRepo,
} from '../src/stores/gitHubStore';
import { Octokit } from '@octokit/rest';
import { AppSettings } from '@deskthing/types'

class GitHubService {
  private gitHubData: GitHubData = {};
  private lastUpdateTime: Date | null;
  private updateTaskId: (() => void) | null = null;
  private deskthing: typeof DeskThing;
  private static instance: GitHubService | null = null;
  private refreshInterval: number = 15;
  private gitHubAccessToken: string | null = null;

  private userRequestEtag: string | null = null;
  private repoRequestEtag: string | null = null;
  private starredReposRequestEtag: string | null = null;

  private openPullRequestRequestEtagStore: Record<string, string | null> = {};
  private closedPullRequestRequestEtagStore: Record<string, string | null> = {};
  private openPullRequestStore: Record<string, GitHubPullRequest[]> = {};
  private closedPullRequestStore: Record<string, GitHubPullRequest[]> = {};

  private openIssueRequestEtagStore: Record<string, string | null> = {};
  private closedIssueRequestEtagStore: Record<string, string | null> = {};
  private openIssueStore: Record<string, GitHubIssue[]> = {};
  private closedIssueStore: Record<string, GitHubIssue[]> = {};

  constructor() {
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
    console.log(`Fetching GitHub data...`);

    // Setup GitHub API Requests
    const octokit = new Octokit({
      auth: this.gitHubAccessToken || '',
    });

    this.gitHubData.user = await this.getAuthenticatedUser(octokit);
    if (this.gitHubData.user) {
      await this.fillMyRepositories(octokit);
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // Use 12-hour format (AM/PM)
    });
    this.lastUpdateTime = now;
    this.gitHubData.lastUpdated = timeString;

    console.log(`GitHub updated`);
    DeskThing.send({
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
      // Don't allow refresh intervals less than 0 minutes
      const interval = this.refreshInterval > 0 ? this.refreshInterval : 15;
      await this.sleep(interval * 60 * 1000);
    }); // Update every set amount of minutes
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public updateData(data: AppSettings) {
    if (!data) {
      console.log('No settings defined');
      return;
    }
    try {
      console.log('Updating settings...');
      this.refreshInterval =
        (data.refreshInterval.value as number) || 15;
      this.gitHubAccessToken =
        (data.gitHubAccessToken.value as string) || null;
      this.updateGitHub();
    } catch (error) {
      console.log('Error updating GitHub data: ' + error);
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
      console.log('Fetching GitHub data...');
      await this.updateGitHub();
    }
    console.log('Returning GitHub data');
    return this.gitHubData;
  }

  private async getAuthenticatedUser(octokit: Octokit) {
    try {
      const requestHeaders: Record<string, string> = {};
      if (this.userRequestEtag) {
        requestHeaders['If-None-Match'] = this.userRequestEtag;
      }

      const { data, headers } = await octokit.users.getAuthenticated({
        headers: requestHeaders,
      });

      if (headers['x-ratelimit-remaining'] === '0') {
        console.log('Rate limit reached');
        return;
      }

      this.userRequestEtag = headers.etag ?? null;

      console.log(`User Headers: ${JSON.stringify(headers)}`);
      return {
        id: data.id,
        username: data.login,
        avatarUrl: data.avatar_url,
        url: data.html_url,
      };
    } catch (error) {
      if (error.status === 304) {
        console.log(`No updates to Authenticated User`);
        return this.gitHubData.user;
      } else {
        console.error(`Error fetching Authenticated User: ${error}`);
        return undefined;
      }
    }
  }

  private async fillMyRepositories(octokit: Octokit) {
    const fetchRepos = async (
      fetchFn: () => Promise<any>,
      etagStore: { value: string | null },
      cacheStore: (data: any) => Promise<void>,
      logPrefix: string
    ) => {
      const requestHeaders: Record<string, string> = {};
      if (etagStore.value) {
        requestHeaders['If-None-Match'] = etagStore.value;
      }

      try {
        const { data, headers } = await fetchFn();

        if (headers['x-ratelimit-remaining'] === '0') {
          console.log('Rate limit reached');
          return;
        }

        etagStore.value = headers.etag ?? null;
        await cacheStore(data);
      } catch (error) {
        if (error.status === 304) {
          console.log(`No updates to ${logPrefix}`);
        } else {
          console.error(`Error fetching ${logPrefix}: ${error}`);
        }
      }
    };

    await fetchRepos(
      () =>
        octokit.repos.listForAuthenticatedUser({
          per_page: 100,
          headers: {
            'If-None-Match': this.repoRequestEtag || '',
          },
        }),
      { value: this.repoRequestEtag },
      async (data) => {
        this.gitHubData.myRepositories = await this.getReposFromData(data);
      },
      'Repositories'
    );

    await fetchRepos(
      () =>
        octokit.rest.activity.listReposStarredByAuthenticatedUser({
          per_page: 100,
          headers: {
            'If-None-Match': this.starredReposRequestEtag || '',
          },
        }),
      { value: this.starredReposRequestEtag },
      async (data) => {
        this.gitHubData.starredRepositories = await this.getReposFromData(data);
      },
      'Starred Repositories'
    );
  }

  private async getReposFromData(data: any): Promise<GitHubRepo[]> {
    return Promise.all(
      data.map(
        async (repo): Promise<GitHubRepo> => ({
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
          owner: {
            id: repo.owner.id,
            username: repo.owner.login,
            avatarUrl: repo.owner.avatar_url,
            url: repo.owner.html_url,
          },
        })
      )
    );
  }

  public async getPullRequestsForRepo(ownerName: string, repoName: string) {
    const octokit = new Octokit({
      auth: this.gitHubAccessToken || '',
    });

    const fetchPullRequests = async (
      state: 'open' | 'closed',
      etagStore: Record<string, string | null>,
      cacheStore: Record<string, GitHubPullRequest[]>
    ): Promise<GitHubPullRequest[]> => {
      const requestHeaders: Record<string, string> = {};
      const cacheKey = `${ownerName}/${repoName}`;
      if (etagStore[cacheKey]) {
        requestHeaders['If-None-Match'] = etagStore[cacheKey]!;
      }

      try {
        const { headers, data } = await octokit.pulls.list({
          headers: requestHeaders,
          owner: ownerName,
          repo: repoName,
          state,
          per_page: 100,
        });

        if (headers['x-ratelimit-remaining'] === '0') {
          console.log('Rate limit reached');
          return [];
        }

        etagStore[cacheKey] = headers.etag ?? null;
        const pullRequests = await this.getPullRequestFromData(data);
        cacheStore[cacheKey] = pullRequests;
        return pullRequests;
      } catch (error) {
        if (error.status === 304) {
          console.log(
            `No updates to ${state} Pull Requests for ${cacheKey}`
          );
          return cacheStore[cacheKey] || [];
        } else {
          console.error(
            `Error fetching ${state} Pull Requests: ${error}`
          );
          return [];
        }
      }
    };

    const [openPullRequests, closedPullRequests] = await Promise.all([
      fetchPullRequests(
        'open',
        this.openPullRequestRequestEtagStore,
        this.openPullRequestStore
      ),
      fetchPullRequests(
        'closed',
        this.closedPullRequestRequestEtagStore,
        this.closedPullRequestStore
      ),
    ]);

    return [...openPullRequests, ...closedPullRequests];
  }

  private async getPullRequestFromData(
    data: any
  ): Promise<GitHubPullRequest[]> {
    return Promise.all(
      data.map(async (pull) => {
        const labels = pull.labels.map((label) => ({
          id: label.id,
          name: label.name,
          color: label.color,
        }));

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
          url: pull.html_url,
          labels,
        };

        if (pull.user) {
          pullRequest.user = {
            id: pull.user.id,
            username: pull.user.login,
            avatarUrl: pull.user.avatar_url,
            url: pull.user.html_url,
          };
        }

        return pullRequest;
      })
    );
  }

  public async getIssuesForRepo(ownerName: string, repoName: string) {
    const octokit = new Octokit({
      auth: this.gitHubAccessToken || '',
    });

    const fetchIssues = async (
      state: 'open' | 'closed',
      etagStore: Record<string, string | null>,
      cacheStore: Record<string, GitHubIssue[]>
    ): Promise<GitHubIssue[]> => {
      const requestHeaders: Record<string, string> = {};
      const cacheKey = `${ownerName}/${repoName}`;
      if (etagStore[cacheKey]) {
        requestHeaders['If-None-Match'] = etagStore[cacheKey]!;
      }

      try {
        const { headers, data } = await octokit.issues.listForRepo({
          headers: requestHeaders,
          owner: ownerName,
          repo: repoName,
          state,
          per_page: 100,
        });

        if (headers['x-ratelimit-remaining'] === '0') {
          console.log('Rate limit reached');
          return [];
        }

        etagStore[cacheKey] = headers.etag ?? null;
        const issues = await this.getIssuesFromData(data);
        cacheStore[cacheKey] = issues;
        return issues;
      } catch (error) {
        if (error.status === 304) {
          console.log(
            `No updates to ${state} Issues for ${cacheKey}`
          );
          return cacheStore[cacheKey] || [];
        } else {
          console.error(`Error fetching ${state} Issues: ${error}`);
          return [];
        }
      }
    };

    const [openIssues, closedIssues] = await Promise.all([
      fetchIssues('open', this.openIssueRequestEtagStore, this.openIssueStore),
      fetchIssues(
        'closed',
        this.closedIssueRequestEtagStore,
        this.closedIssueStore
      ),
    ]);

    return [...openIssues, ...closedIssues];
  }

  private async getIssuesFromData(data: any): Promise<GitHubIssue[]> {
    return Promise.all(
      data.map(async (currentIssue) => {
        const labels = currentIssue.labels
          .filter(
            (label) =>
              typeof label !== 'string' && label.id && label.name && label.color
          )
          .map((label) => ({
            id: label.id,
            name: label.name,
            color: label.color,
          }));

        const issue: GitHubIssue = {
          id: currentIssue.id,
          number: currentIssue.number,
          title: currentIssue.title,
          state: currentIssue.state,
          stateReason: currentIssue.state_reason,
          body: currentIssue.body,
          locked: currentIssue.locked,
          draft: currentIssue.draft ?? false,
          createdAt: currentIssue.created_at,
          updatedAt: currentIssue.updated_at,
          closedAt: currentIssue.closed_at,
          url: currentIssue.html_url,
          labels,
        };

        if (currentIssue.user) {
          issue.user = {
            id: currentIssue.user.id,
            username: currentIssue.user.login,
            avatarUrl: currentIssue.user.avatar_url,
            url: currentIssue.user.html_url,
          };
        }

        return issue;
      })
    );
  }
}

export default GitHubService;
