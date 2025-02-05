import React, { useEffect, useRef, useState } from 'react';
import { GitHubStore } from './stores';
import {
  GitHubData,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRepo,
} from './stores/gitHubStore';
import Header from './components/Header/Header';
import PullRequests from './components/Pull Requests/PullRequests';
import Issues from './components/Issues/Issues';
import { RepoIcon, StarIcon } from '@primer/octicons-react';
import RepoViewer from './components/RepoViewer/RepoViewer';

const App: React.FC = () => {
  const gitHubStore = GitHubStore;
  const [gitHubData, setGitHubData] = useState<GitHubData | null>(
    gitHubStore.getGitHubData()
  );
  const [currentRepos, setCurrentRepos] = useState<GitHubRepo[] | undefined>(
    gitHubData?.myRepositories
  );
  const [currentRepoIndex, setCurrentRepoIndex] = useState(0);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[] | null>(
    null
  );
  const [issues, setIssues] = useState<GitHubIssue[] | null>(null);
  const [filter, setFilter] = useState<'repos' | 'stars'>('repos');
  const [isTallEnough, setIsTallEnough] = useState(false);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (filter === 'repos') {
      setCurrentRepos(gitHubData?.myRepositories);
      setCurrentRepoIndex(0);
    }
    if (filter === 'stars') {
      setCurrentRepos(gitHubData?.starredRepositories);
      setCurrentRepoIndex(0);
    }
  }, [filter]);

  useEffect(() => {
    if (filter === 'stars') {
      setCurrentRepos(gitHubData?.starredRepositories);
      if (
        !gitHubData?.starredRepositories ||
        currentRepoIndex >= gitHubData.starredRepositories.length
      ) {
        setCurrentRepoIndex(0);
      }
      return;
    }

    // If there are no repositories, fallback to 'stars' filter
    if (gitHubData?.myRepositories && gitHubData.myRepositories.length === 0) {
      setFilter('stars');
      return;
    }

    // Fallback to 'repos' filter
    setCurrentRepos(gitHubData?.myRepositories);
    if (
      !gitHubData?.myRepositories ||
      currentRepoIndex >= gitHubData.myRepositories.length
    ) {
      setCurrentRepoIndex(0);
    }
  }, [gitHubData]);

  useEffect(() => {
    const container = contentContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === container) {
          setIsTallEnough(entry.contentRect.height > 400);
        }
      }
    });

    resizeObserver.observe(container);

    // Cleanup observer on component unmount
    return () => {
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
    };
  }, [contentContainerRef.current]);

  useEffect(() => {
    const handleGitHubData = async (data: GitHubData | null) => {
      if (!data) {
        console.log('No GitHub data available');
        return;
      }
      console.log('GitHub data updated:', data);
      setGitHubData(data);
    };

    const handlePullRequests = async (data: GitHubPullRequest[] | null) => {
      setPullRequests(data);
    };

    const handleIssues = async (data: GitHubIssue[] | null) => {
      setIssues(data);
    };

    const removeListener = gitHubStore.on(handleGitHubData);
    const removePullRequestsListener =
      gitHubStore.onPullRequestsRetrieved(handlePullRequests);
    const removeIssuesListener = gitHubStore.onIssuesRetrieved(handleIssues);

    return () => {
      removeListener();
      removePullRequestsListener();
      removeIssuesListener();
    };
  }, []);

  function handleBackClick() {
    setPullRequests(null);
    setIssues(null);
  }

  function handleViewPullRequestsClick(ownerName: string, repoName: string) {
    gitHubStore.getPullRequests(ownerName, repoName);
  }

  function handleViewIssuesClick(ownerName: string, repoName: string) {
    gitHubStore.getIssues(ownerName, repoName);
  }

  function getContent() {
    if (!gitHubData) {
      return (
        <div className='validation'>
          <h2>Loading...</h2>
        </div>
      );
    }

    if (!gitHubData.user) {
      return (
        <div className='validation'>
          <h1>Unable to retrieve Authenticated User</h1>
          <h2>
            Ensure you have you GitHub Access Token configured in Settings
          </h2>
        </div>
      );
    }

    if (
      (!gitHubData.myRepositories || gitHubData.myRepositories.length === 0) &&
      (!gitHubData.starredRepositories ||
        gitHubData.starredRepositories.length === 0)
    ) {
      return (
        <div className='validation'>
          <h1>No Repositories Found</h1>
          <h2>
            Unable to locate any Repositories for ${gitHubData.user.username}
          </h2>
        </div>
      );
    }

    return (
      <div className='contentContainer' ref={contentContainerRef}>
        {(!pullRequests || pullRequests.length == 0) &&
          (!issues || issues.length == 0) && (
            <>
              <RepoViewer
                repos={currentRepos}
                currentRepoIndex={currentRepoIndex}
                setCurrentRepoIndex={setCurrentRepoIndex}
                handleViewIssuesClick={handleViewIssuesClick}
                handleViewPullRequestsClick={handleViewPullRequestsClick}
              />
              {isTallEnough && (
                <div className='repoContainer--tabs'>
                  {gitHubData.myRepositories &&
                    gitHubData.myRepositories.length > 0 && (
                      <button
                        className={`repoContainer--filter ${
                          filter === 'repos' ? 'active' : ''
                        }`}
                        onClick={() => setFilter('repos')}
                      >
                        <RepoIcon size={32} />
                        <p>Repositories</p>
                      </button>
                    )}
                  {gitHubData.starredRepositories &&
                    gitHubData.starredRepositories.length > 0 && (
                      <button
                        className={`repoContainer--filter ${
                          filter === 'stars' ? 'active' : ''
                        }`}
                        onClick={() => setFilter('stars')}
                      >
                        <StarIcon size={32} />
                        <p>Stars</p>
                      </button>
                    )}
                </div>
              )}
            </>
          )}

        {/* Pull Requests Section */}
        {pullRequests && pullRequests.length > 0 && (
          <PullRequests
            pullRequests={pullRequests}
            onBackClick={handleBackClick}
          />
        )}

        {/* Issues Section */}
        {(!pullRequests || pullRequests.length == 0) &&
          issues &&
          issues.length > 0 && (
            <Issues issues={issues} onBackClick={handleBackClick} />
          )}
      </div>
    );
  }

  return (
    <div className='appContainer w-screen h-screen'>
      <Header lastUpdated={gitHubData?.lastUpdated} />
      {getContent()}
    </div>
  );
};

export default App;
