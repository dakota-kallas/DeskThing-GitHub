import { DeskThing } from 'deskthing-client';
import { SocketData } from 'deskthing-server';

export type GitHubData = {
  /**
   * Authenticated GitHub User's Repositories
   */
  myRepositories?: GitHubRepo[];
  /**
   * Last Refreshed Time
   */
  lastUpdated?: string;
};

export interface GitHubUser {
  username: string;
  id: number;
  avatarUrl: string;
  url: string;
}

export interface GitHubIssue {
  id: number;
  title: string;
  state: string;
  locked: boolean;
  user: GitHubUser;
  body: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  owner: GitHubUser;
  url: string;
  description: string | null;
  fork: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  pushedAt: string | null;
  size: number;
  stars: number;
  language: string | null;
  archived: boolean;
  disabled: boolean;
  visibility?: string;
  forks: number;
  openIssues: number;
  watchers: number;
  defaultBranch: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  locked: boolean;
  user?: GitHubUser;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  draft: boolean;
  baseBranch: string;
  headBranch: string;
}

type GitHubListener = (gitHubData: GitHubData | null) => void;
type PullRequestsListener = (pullRequests: GitHubPullRequest[] | null) => void;

export class GitHubStore {
  private static instance: GitHubStore | null = null;
  private gitHubData: GitHubData | null = null;
  private pullRequests: GitHubPullRequest[] | null = null;
  private deskThing: DeskThing;
  private listeners: GitHubListener[] = [];
  private pullRequestsListener: PullRequestsListener = () => {};

  constructor() {
    this.deskThing = DeskThing.getInstance();
    this.deskThing.on('github', (data: SocketData) => {
      if (data.type === 'github_data') {
        this.gitHubData = data.payload as GitHubData;
        this.notifyListeners();
      } else if (data.type === 'github_pull_requests') {
        this.pullRequests = data.payload as GitHubPullRequest[];
        this.pullRequestsListener(this.pullRequests);
      }
    });

    this.requestGitHubData();
  }

  static getInstance(): GitHubStore {
    if (!GitHubStore.instance) {
      GitHubStore.instance = new GitHubStore();
    }
    return GitHubStore.instance;
  }

  onPullRequestsRetrieved(method: PullRequestsListener) {
    this.pullRequestsListener = method;

    return () => {
      this.pullRequestsListener = () => {};
    };
  }

  on(listener: GitHubListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getGitHubData(): GitHubData | null {
    if (!this.gitHubData) {
      this.requestGitHubData();
    }
    return this.gitHubData;
  }

  getPullRequests(
    ownerName: string,
    repoName: string
  ): GitHubPullRequest[] | null {
    this.requestPullRequests(ownerName, repoName);

    return this.pullRequests;
  }

  private notifyListeners() {
    if (!this.gitHubData) {
      this.getGitHubData();
    }
    this.deskThing.send({
      app: 'client',
      type: 'log',
      payload: 'Getting GitHub data',
    });
    this.listeners.forEach((listener) => listener(this.gitHubData));
  }

  async requestGitHubData(): Promise<void> {
    this.deskThing.send({
      type: 'get',
      request: 'github_data',
    });
  }

  async requestPullRequests(
    ownerName: string,
    repoName: string
  ): Promise<void> {
    this.deskThing.send({
      type: 'get',
      request: 'github_pull_requests',
      payload: {
        ownerName,
        repoName,
      },
    });
  }
}

export default GitHubStore.getInstance();
