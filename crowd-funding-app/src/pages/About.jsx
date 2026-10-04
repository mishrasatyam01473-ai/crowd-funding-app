import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function About() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/#about', { replace: true });
  }, [navigate]);

  return null;
}

export default About;
