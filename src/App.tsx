import React, { useEffect, useRef, useState } from 'react';
import { GitHubStore } from './stores';
import { GitHubData, GitHubPullRequest } from './stores/gitHubStore';
import Header from './components/Header/Header';
import Repo from './components/Repo/Repo';
import { GrFormNext, GrFormPrevious } from 'react-icons/gr';
import PullRequests from './components/Pull Requests/PullRequests';

const App: React.FC = () => {
  const gitHubStore = GitHubStore;
  const [gitHubData, setGitHubData] = useState<GitHubData | null>(
    gitHubStore.getGitHubData()
  );
  const [currentRepoIndex, setCurrentRepoIndex] = useState(0);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[] | null>(
    null
  );
  const repoContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleGitHubData = async (data: GitHubData | null) => {
      if (!data) {
        console.log('No GitHub data available');
        return;
      }
      console.log('GitHub data updated:', data);
      setGitHubData(data);
    };

    const handle = async (data: GitHubPullRequest[] | null) => {
      setPullRequests(data);
    };

    const removeListener = gitHubStore.on(handleGitHubData);
    const removePullRequestsListener =
      gitHubStore.onPullRequestsRetrieved(handle);

    return () => {
      removeListener();
      removePullRequestsListener();
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
  }

  function handleViewPullRequestsClick() {
    const repo = gitHubData!.myRepositories![currentRepoIndex];
    gitHubStore.getPullRequests(repo.owner.username, repo.name);
  }

  const atStart = currentRepoIndex === 0;
  const atEnd =
    gitHubData?.myRepositories &&
    currentRepoIndex === gitHubData.myRepositories.length - 1;
  const hasRepositories =
    gitHubData?.myRepositories && gitHubData?.myRepositories?.length > 0;
  const currentRepo = hasRepositories
    ? gitHubData.myRepositories![currentRepoIndex]
    : null;

  return (
    <div className='appContainer w-screen h-screen'>
      <Header lastUpdated={gitHubData?.lastUpdated} />
      <div className='contentContainer'>
        {!pullRequests && hasRepositories && (
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
              />
            )}
          </div>
        )}

        {/* Pull Requests Section */}
        {pullRequests && pullRequests?.length > 0 && (
          <PullRequests
            pullRequests={pullRequests}
            onBackClick={handleBackClick}
          />
        )}
      </div>
    </div>
  );
};

export default App;
