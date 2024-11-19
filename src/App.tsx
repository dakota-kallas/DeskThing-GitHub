import React, { useEffect, useRef, useState } from 'react';
import { GitHubStore } from './stores';
import { GitHubData, GitHubPullRequest } from './stores/gitHubStore';
import Header from './components/Header/Header';
import Repo from './components/Repo/Repo';
import { GrFormNext, GrFormPrevious } from 'react-icons/gr';

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

    const removeListener = gitHubStore.on(handleGitHubData);

    return () => {
      removeListener();
    };
  }, []);

  function handleNextClick() {
    setCurrentRepoIndex((prev) => prev + 1);
  }

  function handlePreviousClick() {
    setCurrentRepoIndex((prev) => prev - 1);
  }

  function handleViewPullRequestsClick() {
    const repo = gitHubData!.myRepositories![currentRepoIndex];
    gitHubStore.getPullRequests(repo.owner.username, repo.name);
  }

  const atStart = currentRepoIndex === 0;
  const atEnd =
    gitHubData?.myRepositories &&
    currentRepoIndex === gitHubData.myRepositories.length - 1;

  return (
    <div className='appContainer w-screen h-screen'>
      <Header lastUpdated={gitHubData?.lastUpdated} />
      <div className='contentContainer'>
        {gitHubData?.myRepositories && (
          <div className='repoContainer' ref={repoContainerRef}>
            <div>
              <button
                onClick={handlePreviousClick}
                className={atStart ? 'invisible' : ''}
                disabled={atStart}
              >
                <GrFormPrevious size={48} color='var(--text)' />
              </button>
            </div>
            {gitHubData.myRepositories.length > currentRepoIndex && (
              <Repo
                repo={gitHubData.myRepositories[currentRepoIndex]}
                onPullRequestsClick={handleViewPullRequestsClick}
              />
            )}
            <div>
              <button
                onClick={handleNextClick}
                className={atEnd ? 'invisible' : ''}
                disabled={atEnd}
              >
                <GrFormNext size={48} color='var(--text)' />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
