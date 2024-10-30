import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';


interface CustomGetTokenSilentlyOptions {
  audience?: string;
  scope?: string;
  detailedResponse?: boolean;
}

const MyComponent = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const options: CustomGetTokenSilentlyOptions = {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: import.meta.env.VITE_AUTH0_SCOPE,
        };

        const accessToken = await getAccessTokenSilently(options as any);

        const response = await fetch('https://myapi.example.com/endpoint', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        setData(responseData);
      } catch (error: any) {
        console.error('Error fetching data', error.message);
      }
    };

    fetchData();
  }, [getAccessTokenSilently]);

  return (
    <div>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
};

export default MyComponent;
