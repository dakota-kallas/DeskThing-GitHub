import './issue.css';
import { GitHubIssue } from '../../stores/gitHubStore';
import {
  IssueClosedIcon,
  IssueDraftIcon,
  IssueOpenedIcon,
  IssueReopenedIcon,
} from '@primer/octicons-react';
import { RxOpenInNewWindow } from 'react-icons/rx';

interface IssueProps {
  issue: GitHubIssue;
  onOpenClick: (url: string) => void;
}

const Issue = ({ issue: issue, onOpenClick }: IssueProps) => {
  const createdDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  return (
    <div className='issue'>
      <div className='issue--content'>
        <div className='issue--details'>
          {getIcon()}
          <h2>{issue.title}</h2>
          <div className='issue--labels'>
            {issue.labels?.map((label) => (
              <p
                className='issue--label'
                key={label.id}
                style={{
                  color: `#${label.color}`,
                  borderColor: `#${label.color}`,
                  backgroundColor: `#${label.color}2A`,
                }}
              >
                {label.name}
              </p>
            ))}
          </div>
        </div>
        <div className='issue-subDetails'>
          <p>#{issue.number}</p>
          <p>created on {createdDate}</p>
          {issue.user && <p>by {issue.user?.username}</p>}
        </div>
      </div>
      <button
        className='issue--open'
        onClick={() => {
          onOpenClick(issue.url);
        }}
      >
        <RxOpenInNewWindow size={32} />
      </button>
    </div>
  );

  function getIcon() {
    if (issue.draft) {
      return <IssueDraftIcon size={24} className='issue--icon' />;
    } else if (issue.stateReason === 'reopened') {
      return <IssueReopenedIcon size={24} className='issue--openIcon' />;
    } else if (issue.state === 'open') {
      return <IssueOpenedIcon size={24} className='issue--openIcon' />;
    } else if (issue.state === 'closed') {
      if (issue.stateReason === 'completed' || issue.stateReason === null) {
        return <IssueClosedIcon size={24} className='issue--closedIcon' />;
      }
      return <IssueClosedIcon size={24} className='issue--icon' />;
    } else {
      return <IssueOpenedIcon size={24} className='issue--icon' />;
    }
  }
};

export default Issue;
