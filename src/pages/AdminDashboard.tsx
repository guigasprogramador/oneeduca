import { useEffect, useState } from 'react';
import { getMyEndpointData } from '@/services/api';

export function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getMyEndpointData().then(response => {
      setData(response.data);
    });
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Data Loaded</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}