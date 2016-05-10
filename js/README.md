# Environmental Variables

1. TESTDROID_API_KEY: the runner need only this
2. TESTDROID_TARGET: android (api level >= 17) or selendroid (api level < 17)
3. TESTDROID_PROJECT: name of the testdroid project, possible values are
    1. *CLIQZ Browser (android, standard)*
    2. *CLIQZ Browser (android, xwalk)*
4. TESTDROID_TESTRUN: testrun name
5. TESTDROID_DEVICE: device to be used for the test
6. TESTDROID_APP: url, path on testdroid cloud or the string
   *latest* (the latter is the default)
