import { DeskThing } from "@deskthing/client";
import { SocketData } from "@deskthing/types";

export type GitHubData = {
  /**
   * Authenticated GitHub User
   */
  user?: GitHubUser;
  /**
   * Authenticated GitHub User's Repositories
   */
  myRepositories?: GitHubRepo[];
  /**
   * Authenticated GitHub User's Starred Repositories
   */
  starredRepositories?: GitHubRepo[];
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
  number: number;
  title: string;
  state: string;
  stateReason?: "completed" | "reopened" | "not_planned" | null;
  locked: boolean;
  draft: boolean;
  user?: GitHubUser;
  body?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  url: string;
  labels: GitHubLabel[];
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
  url: string;
  labels: GitHubLabel[];
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
}

type GitHubListener = (gitHubData: GitHubData | null) => void;
type PullRequestsListener = (pullRequests: GitHubPullRequest[] | null) => void;
type IssuesListener = (issues: GitHubIssue[] | null) => void;

export class GitHubStore {
  private static instance: GitHubStore | null = null;
  private gitHubData: GitHubData | null = null;
  private pullRequests: GitHubPullRequest[] | null = null;
  private issues: GitHubIssue[] | null = null;
  private listeners: GitHubListener[] = [];
  private pullRequestsListener: PullRequestsListener = () => {};
  private issuesListener: IssuesListener = () => {};

  constructor() {
    DeskThing.on("github_data", (data: SocketData) => {
      this.gitHubData = data.payload as GitHubData;
      this.notifyListeners();
    });
    DeskThing.on("github_pull_requests", (data: SocketData) => {
      this.pullRequests = data.payload as GitHubPullRequest[];
      this.pullRequestsListener(this.pullRequests);
    });
    DeskThing.on("github_issues", (data: SocketData) => {
      this.issues = data.payload as GitHubIssue[];
      this.issuesListener(this.issues);
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

  onIssuesRetrieved(method: IssuesListener) {
    this.issuesListener = method;

    return () => {
      this.issuesListener = () => {};
    };
  }

  on(listener: GitHubListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  openURL(url: string) {
    DeskThing.send({
      type: "get",
      request: "open_url",
      payload: url,
    });
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

  getIssues(ownerName: string, repoName: string): GitHubIssue[] | null {
    this.requestIssues(ownerName, repoName);

    return this.issues;
  }

  private notifyListeners() {
    if (!this.gitHubData) {
      this.getGitHubData();
    }
    DeskThing.send({
      app: "client",
      type: "log",
      payload: "Getting GitHub data",
    });
    this.listeners.forEach((listener) => listener(this.gitHubData));
  }

  async requestGitHubData(): Promise<void> {
    DeskThing.send({
      type: "get",
      request: "github_data",
    });
  }

  async requestPullRequests(
    ownerName: string,
    repoName: string
  ): Promise<void> {
    DeskThing.send({
      type: "get",
      request: "github_pull_requests",
      payload: {
        ownerName,
        repoName,
      },
    });
  }

  async requestIssues(ownerName: string, repoName: string): Promise<void> {
    DeskThing.send({
      type: "get",
      request: "github_issues",
      payload: {
        ownerName,
        repoName,
      },
    });
  }
}

export default GitHubStore.getInstance();
