pipeline {
  agent any
  options {
    timeout(time: 15, unit: 'MINUTES')
  }
  stages {
    stage('Prepare') {
      steps {
        nvm("v24.13.1") {
          sh 'yarn install'
        }
      }
    }
    stage('Build') {
        steps {
          nvm("v24.13.1") {
            sh 'yarn build'
          }
        }
    }
    stage('Test') {
        steps {
          nvm("v24.13.1") {
            sh 'yarn test'
          }
        }
    }
    stage('Vulnerability Scan') {
      when {
        anyOf {
          branch 'master'
          expression { return env.BRANCH_NAME.startsWith('rc') }
        }
      }
      steps {
        trivy_scan()
      }
    }
    stage('Publish') {
      when {
        allOf {
          branch 'master'
          expression { return new_version() }
        }
      }
      steps {
        nvm("v24.13.1") {
          publish()
        }
      }
    }
  }
  post { 
    always { 
      script {
        jenkinsNotification()
      }
    }
  }
}

def trivy_scan() {
  cache_dir="${WORKSPACE}/trivy-cache"
  sh "mkdir -p ${cache_dir}"
  sh "aws s3 sync --profile=production s3://trivy-cache ${cache_dir} && unzip -o ${cache_dir}/trivy-cache.zip -d ${cache_dir}"
  sh "trivy fs --cache-dir ${cache_dir} --ignore-unfixed --severity HIGH,CRITICAL --exit-code 1 ."
}

def published_version() {
  return sh (
      script: 'npm view $(jq -r .name < package.json) version',
      returnStdout: true
  ).trim()
}

def package_version() {
  return sh (
      script: 'jq -r .version < package.json',
      returnStdout: true
  ).trim()
}

def new_version() {
  return (published_version() != package_version())
}

def publish() {
  sh 'npm publish'
  sh "git tag -a 'v${package_version()}' -m 'npm version v${package_version()}'"
  sh "git push origin 'v${package_version()}'"
}
