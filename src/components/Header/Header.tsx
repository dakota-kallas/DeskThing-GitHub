import { useEffect, useState } from 'react';
import { SettingsStore } from '../../stores/settingsStore';
import './header.css';
import refreshImg from '../../assets/refresh.png';
import { getTimeDifference } from '../../utilities/date';

// Move getInstance() calls outside the hook to avoid redundant calls
const settingsStore = SettingsStore.getInstance();

interface HeaderProps {
  lastUpdated?: string;
}

const Header = ({ lastUpdated }: HeaderProps) => {
  // Initial time fetched from SettingsStore
  const [time, setTime] = useState(() => {
    return settingsStore.getTime().trim();
  });
  const currentDifference = getTimeDifference(time, lastUpdated);
  const [difference, setDifference] = useState(currentDifference);

  useEffect(() => {
    const handleTime = async (time: string) => {
      setTime(time.trim());
      setDifference(getTimeDifference(time, lastUpdated));
    };

    // Set the time listener
    const removeTimeListener = settingsStore.onTime(handleTime);

    return () => {
      // Clean up listeners on unmount
      removeTimeListener();
    };
  }, []);

  return (
    <div className='header'>
      <div className='font-bold'>{time}</div>
      <div className='header--refresh'>
        <span>
          <img className='header--refreshImg' src={refreshImg} />
        </span>
        <span>{difference ?? currentDifference}</span>
      </div>
    </div>
  );
};

export default Header;
