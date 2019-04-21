module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: {
      global: 'routing',
      externals: {
        react: 'React'
      }
    }
  },
  devServer:{
    hot: false
  }
};
