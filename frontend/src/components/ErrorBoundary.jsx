import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:'2rem'}}>
          <h2>Something went wrong.</h2>
          <pre style={{whiteSpace:'pre-wrap',background:'#111',color:'#eee',padding:'1rem',borderRadius:8,marginTop:'1rem'}}>
            {String(this.state.error)}
          </pre>
          <button onClick={() => this.setState({hasError:false,error:null})} style={{marginTop:'1rem'}}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
