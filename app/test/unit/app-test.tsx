import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as TestUtils from 'react-dom/test-utils'

import { App } from '../../src/ui/app'
import { Dispatcher } from '../../src/ui/dispatcher'
import {
  AppStore,
  GitHubUserStore,
  CloningRepositoriesStore,
  IssuesStore,
  SignInStore,
  RepositoriesStore,
  AccountsStore,
  PullRequestStore,
  PullRequestCoordinator,
} from '../../src/lib/stores'
import { InMemoryDispatcher } from '../helpers/in-memory-dispatcher'
import {
  TestGitHubUserDatabase,
  TestIssuesDatabase,
  TestRepositoriesDatabase,
  TestPullRequestDatabase,
} from '../helpers/databases'
import { InMemoryStore, AsyncInMemoryStore } from '../helpers/stores'
import { RepositoryStateCache } from '../../src/lib/stores/repository-state-cache'
import { ApiRepositoriesStore } from '../../src/lib/stores/api-repositories-store'
import { CommitStatusStore } from '../../src/lib/stores/commit-status-store'

describe('App', () => {
  let appStore: AppStore
  let dispatcher: Dispatcher
  let repositoryStateManager: RepositoryStateCache
  let githubUserStore: GitHubUserStore
  let issuesStore: IssuesStore

  beforeEach(async () => {
    const db = new TestGitHubUserDatabase()
    await db.reset()

    const issuesDb = new TestIssuesDatabase()
    await issuesDb.reset()

    const repositoriesDb = new TestRepositoriesDatabase()
    await repositoriesDb.reset()
    const repositoriesStore = new RepositoriesStore(repositoriesDb)

    const accountsStore = new AccountsStore(
      new InMemoryStore(),
      new AsyncInMemoryStore()
    )

    const pullRequestCoordinator = new PullRequestCoordinator(
      new PullRequestStore(new TestPullRequestDatabase(), repositoriesStore),
      repositoriesStore
    )

    githubUserStore = new GitHubUserStore(db)
    issuesStore = new IssuesStore(issuesDb)

    repositoryStateManager = new RepositoryStateCache(repo =>
      githubUserStore.getUsersForRepository(repo)
    )

    const apiRepositoriesStore = new ApiRepositoriesStore(accountsStore)
    const commitStatusStore = new CommitStatusStore(accountsStore)

    appStore = new AppStore(
      githubUserStore,
      new CloningRepositoriesStore(),
      issuesStore,
      new SignInStore(),
      accountsStore,
      repositoriesStore,
      pullRequestCoordinator,
      repositoryStateManager,
      apiRepositoriesStore
    )

    dispatcher = new InMemoryDispatcher(
      appStore,
      repositoryStateManager,
      commitStatusStore
    )
  })

  it('renders', async () => {
    const app = TestUtils.renderIntoDocument<any>(
      <App
        dispatcher={dispatcher}
        appStore={appStore}
        repositoryStateManager={repositoryStateManager}
        issuesStore={issuesStore}
        gitHubUserStore={githubUserStore}
        startTime={0}
      />
    )
    // Give any promises a tick to resolve.
    await wait(0)

    // @ts-ignore
    const node = ReactDOM.findDOMNode(app)
    expect(node).not.toBeNull()
  })
})

function wait(timeout: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(resolve, timeout)
  })
}
