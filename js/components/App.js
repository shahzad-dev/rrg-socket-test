import React from 'react';
import Relay from 'react-relay';
import hobbyAddMutation from './hobbyAddMutation';

class App extends React.Component {

    static contextTypes = {
      relay: Relay.PropTypes.Environment,
    }

    constructor( props, context ) {

      super( props, context )

      this.state = {
        count: 0,
      }
    }

_handle_OnChange = ( event ) => {
    //this.setState({count: this.state.count + 1});
    console.log(this.props.viewer.hobbies.edges.length);
    this.context.relay.commitUpdate(
        new hobbyAddMutation( {
          id: `${this.props.viewer.hobbies.edges.length + 1}`,
          title: `blah`, // ${this.state.count}`,
          Viewer: this.props.viewer
        } )
      )
    this.setState({count: this.props.viewer.hobbies.edges.length });
 }
  render() {
    return (
      <div>
        <h1>Hobbies list (Total: {this.state.count})</h1>
        <ul>
          {this.props.viewer.hobbies.edges.map((edge, i) =>
            <li key={i}>{edge.node.title} (ID: {i})</li>
          )}
        </ul>
        <button onClick={this._handle_OnChange}>Add New</button>
      </div>
    );
  }
}

export default Relay.createContainer(App, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        hobbies(first: 100) {
          edges {
            node {
              title,
            },
          },
        },
        ${hobbyAddMutation.getFragment('Viewer')},
      }
    `,
  },
});
