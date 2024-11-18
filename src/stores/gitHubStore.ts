import { DeskThing } from 'deskthing-client';
import { SocketData } from 'deskthing-server';

export type GitHubData = {
  /**
   * Last Refreshed Time
   */
  lastUpdated?: string;
};

type GitHubListener = (gitHubData: GitHubData | null) => void;

export class GitHubStore {
  private static instance: GitHubStore | null = null;
  private gitHubData: GitHubData | null = null;
  private deskThing: DeskThing;
  private listeners: GitHubListener[] = [];

  constructor() {
    this.deskThing = DeskThing.getInstance();
    this.deskThing.on('github', (data: SocketData) => {
      this.gitHubData = data.payload as GitHubData;
      this.notifyListeners();
    });

    this.requestGitHubData();
  }

  static getInstance(): GitHubStore {
    if (!GitHubStore.instance) {
      GitHubStore.instance = new GitHubStore();
    }
    return GitHubStore.instance;
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

  private notifyListeners() {
    if (!this.gitHubData) {
      this.getGitHubData();
    }
    this.deskThing.sendMessageToParent({
      app: 'client',
      type: 'log',
      payload: 'Getting GitHub data',
    });
    this.listeners.forEach((listener) => listener(this.gitHubData));
  }
  async requestGitHubData(): Promise<void> {
    this.deskThing.sendMessageToParent({
      type: 'get',
      request: 'github_data',
    });
  }
}

export default GitHubStore.getInstance();
