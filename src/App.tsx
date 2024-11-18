import React, { useEffect, useState } from 'react';
import { GitHubStore } from './stores';
import { GitHubData } from './stores/gitHubStore';
import Header from './components/Header/Header';
import Repo from './components/Repo/Repo';

const App: React.FC = () => {
  const gitHubStore = GitHubStore;
  const [gitHubData, setGitHubData] = useState<GitHubData | null>(
    gitHubStore.getGitHubData()
  );

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

  return (
    <div className='appContainer w-screen h-screen'>
      <Header lastUpdated={gitHubData?.lastUpdated} />
      {gitHubData?.repository && <Repo repo={gitHubData.repository} />}
    </div>
  );
};

export default App;
