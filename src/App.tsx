import React, { useEffect, useRef, useState } from 'react';
import { GitHubStore } from './stores';
import {
  GitHubData,
  GitHubIssue,
  GitHubPullRequest,
} from './stores/gitHubStore';
import Header from './components/Header/Header';
import Repo from './components/Repo/Repo';
import { GrFormNext, GrFormPrevious } from 'react-icons/gr';
import PullRequests from './components/Pull Requests/PullRequests';
import Issues from './components/Issues/Issues';
import { RepoIcon, StarIcon } from '@primer/octicons-react';

const App: React.FC = () => {
  const gitHubStore = GitHubStore;
  const [gitHubData, setGitHubData] = useState<GitHubData | null>(
    gitHubStore.getGitHubData()
  );
  const [currentRepoIndex, setCurrentRepoIndex] = useState(0);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[] | null>(
    null
  );
  const [issues, setIssues] = useState<GitHubIssue[] | null>(null);
  const repoContainerRef = useRef<HTMLDivElement | null>(null);
  const [filter, setFilter] = useState<'repos' | 'stars'>('repos');
  const [isTallEnough, setIsTallEnough] = useState(false);

  const contentContainerRef = useRef<HTMLDivElement>(null);

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

  const atStart = currentRepoIndex === 0;
  const atEnd =
    gitHubData?.myRepositories &&
    currentRepoIndex === gitHubData.myRepositories.length - 1;
  const hasRepositories =
    gitHubData?.myRepositories && gitHubData?.myRepositories?.length > 0;
  const currentRepo = hasRepositories
    ? gitHubData.myRepositories![currentRepoIndex]
    : null;

  useEffect(() => {
    const handleScroll = (event: WheelEvent) => {
      if (event.deltaX !== 0 && repoContainerRef.current) {
        event.preventDefault();
        console.log('Scrolling horizontally:', event.deltaX, atStart, atEnd);
        if (event.deltaX > 0 && !atEnd) {
          setCurrentRepoIndex((prev) => prev + 1);
        } else if (event.deltaX < 0 && !atStart) {
          setCurrentRepoIndex((prev) => prev - 1);
        }
      }
    };

    document?.addEventListener('wheel', handleScroll, { passive: false });

    return () => {
      document?.removeEventListener('wheel', handleScroll);
    };
  }, [atEnd, atStart]);

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

  function handleNextClick() {
    setCurrentRepoIndex((prev) => prev + 1);
  }

  function handlePreviousClick() {
    setCurrentRepoIndex((prev) => prev - 1);
  }

  function handleBackClick() {
    setPullRequests(null);
    setIssues(null);
  }

  function handleViewPullRequestsClick() {
    const repo = gitHubData!.myRepositories![currentRepoIndex];
    gitHubStore.getPullRequests(repo.owner.username, repo.name);
  }

  function handleViewIssuesClick() {
    const repo = gitHubData!.myRepositories![currentRepoIndex];
    gitHubStore.getIssues(repo.owner.username, repo.name);
  }

  function handleTabClick(tab: 'repos' | 'stars') {
    setFilter(tab);
    setCurrentRepoIndex(0);
  }

  return (
    <div className='appContainer w-screen h-screen'>
      <Header lastUpdated={gitHubData?.lastUpdated} />
      <div className='contentContainer' ref={contentContainerRef}>
        {(!pullRequests || pullRequests.length == 0) &&
          (!issues || issues.length == 0) &&
          hasRepositories && (
            <>
              <div className='repoContainer' ref={repoContainerRef}>
                {/* Previous Button */}
                <div className='repoContainer--navigation'>
                  <button
                    onClick={handlePreviousClick}
                    className={`navigationButton ${atStart ? 'invisible' : ''}`}
                    disabled={atStart}
                  >
                    <GrFormPrevious size={48} color='var(--text)' />
                  </button>
                  <button
                    onClick={handleNextClick}
                    className={`navigationButton ${atEnd ? 'invisible' : ''}`}
                    disabled={atEnd}
                  >
                    <GrFormNext size={48} color='var(--text)' />
                  </button>
                </div>

                {/* Current Repository */}
                {currentRepo && (
                  <Repo
                    repo={currentRepo}
                    onPullRequestsClick={handleViewPullRequestsClick}
                    onIssuesClick={handleViewIssuesClick}
                  />
                )}
              </div>
              {isTallEnough && (
                <div className='repoContainer--tabs'>
                  <button
                    className={`repoContainer--filter ${
                      filter === 'repos' ? 'active' : ''
                    }`}
                    onClick={() => setFilter('repos')}
                  >
                    <RepoIcon size={32} />
                    <p>Repositories</p>
                  </button>
                  <button
                    className={`repoContainer--filter ${
                      filter === 'stars' ? 'active' : ''
                    }`}
                    onClick={() => setFilter('stars')}
                  >
                    <StarIcon size={32} />
                    <p>Stars</p>
                  </button>
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
    </div>
  );
};

export default App;
