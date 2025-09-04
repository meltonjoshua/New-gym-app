import urllib.request
import urllib.error
import sys
import os

def health_check():
    port = os.environ.get('PORT', '5000')
    url = f'http://localhost:{port}/health'
    
    try:
        response = urllib.request.urlopen(url, timeout=2)
        status_code = response.getcode()
        print(f'HEALTHCHECK STATUS: {status_code}')
        
        if status_code == 200:
            sys.exit(0)
        else:
            sys.exit(1)
            
    except urllib.error.URLError as e:
        print(f'HEALTHCHECK ERROR: {e}')
        sys.exit(1)
    except Exception as e:
        print(f'HEALTHCHECK ERROR: {e}')
        sys.exit(1)

if __name__ == '__main__':
    health_check()
