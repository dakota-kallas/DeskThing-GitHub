import './pullrequests.css';
import { GitHubPullRequest } from '../../stores/gitHubStore';
import PullRequest from '../Pull Request/PullRequest';
import { IoMdArrowRoundBack } from 'react-icons/io';
import { CheckIcon, GitPullRequestIcon } from '@primer/octicons-react';
import { useState } from 'react';

interface PullRequestsProps {
  pullRequests: GitHubPullRequest[];
  onBackClick: () => void;
}

const PullRequests = ({ pullRequests, onBackClick }: PullRequestsProps) => {
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  const openPullRequests = pullRequests.filter(
    (pullRequest) => pullRequest.state === 'open' || pullRequest.draft
  );

  const otherPullRequests = pullRequests.filter(
    (pullRequest) => pullRequest.state !== 'open' && !pullRequest.draft
  );

  return (
    <div className='pulls--container'>
      <div className='pulls--controls'>
        <button onClick={onBackClick} className='pulls--back'>
          <IoMdArrowRoundBack size={20} />
          <p>Back</p>
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`pulls--filter ${
            filter === 'open' ? 'pulls--activeFilter' : ''
          }`}
        >
          <GitPullRequestIcon size={20} />
          <p>{openPullRequests.length} Open</p>
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`pulls--filter ${
            filter === 'closed' ? 'pulls--activeFilter' : ''
          }`}
        >
          <CheckIcon size={20} />
          <p>{otherPullRequests.length} Closed</p>
        </button>
      </div>
      <div className='pulls'>
        {filter === 'open' &&
          openPullRequests.map((pullRequest, index) => (
            <PullRequest pullRequest={pullRequest} key={index} />
          ))}
        {filter === 'closed' &&
          otherPullRequests.map((pullRequest, index) => (
            <PullRequest pullRequest={pullRequest} key={index} />
          ))}
      </div>
    </div>
  );
};

export default PullRequests;
