module.exports = {
  apps : [{
    name: "dao",
    script: 'cd dao; yarn staging',
  }, {
    name: "frontend",
    script: 'cd frontend; yarn dev80',
  }],
};
