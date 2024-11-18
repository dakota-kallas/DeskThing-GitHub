import './repo.css';
import { GitHubRepo } from '../../stores/gitHubStore';

interface RepoProps {
  repo: GitHubRepo;
}

const Repo = ({ repo }: RepoProps) => {
  return (
    <div className=''>
      <div>
        <h2>{repo.name}</h2>
      </div>
      <div>
        <p>{repo.description}</p>
      </div>
    </div>
  );
};

export default Repo;
