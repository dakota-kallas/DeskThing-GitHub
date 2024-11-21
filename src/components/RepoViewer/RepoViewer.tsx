import { GitHubRepo } from '../../stores/gitHubStore';
import { useEffect, useRef } from 'react';
import { GrFormNext, GrFormPrevious } from 'react-icons/gr';
import Repo from '../Repo/Repo';

interface RepoViewerProps {
  repos?: GitHubRepo[];
  handleViewPullRequestsClick: (ownerName: string, repoName: string) => void;
  handleViewIssuesClick: (ownerName: string, repoName: string) => void;
  currentRepoIndex: number;
  setCurrentRepoIndex: React.Dispatch<React.SetStateAction<number>>;
}

const RepoViewer = ({
  repos,
  handleViewIssuesClick,
  handleViewPullRequestsClick,
  currentRepoIndex,
  setCurrentRepoIndex,
}: RepoViewerProps) => {
  const repoContainerRef = useRef<HTMLDivElement | null>(null);

  const atStart = repos && currentRepoIndex === 0;
  const atEnd = repos && currentRepoIndex === repos.length - 1;
  const hasRepositories = repos && repos.length > 0;
  const currentRepo = hasRepositories ? repos![currentRepoIndex] : null;

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

  function handleNextClick() {
    setCurrentRepoIndex((prev) => prev + 1);
  }

  function handlePreviousClick() {
    setCurrentRepoIndex((prev) => prev - 1);
  }

  return (
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
          onPullRequestsClick={() => {
            handleViewPullRequestsClick(
              currentRepo.owner.username,
              currentRepo.name
            );
          }}
          onIssuesClick={() => {
            handleViewIssuesClick(currentRepo.owner.username, currentRepo.name);
          }}
        />
      )}
    </div>
  );
};

export default RepoViewer;
