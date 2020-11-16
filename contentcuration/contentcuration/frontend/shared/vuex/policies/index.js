import findKey from 'lodash/findKey';
import sortBy from 'lodash/sortBy';
import transform from 'lodash/transform';
import { policyDates } from 'shared/constants';
import client from 'shared/client';

function _parseDateFormat(dateString) {
  const [date, time] = dateString.split(' ');
  const [day, month, year] = date.split('/');
  return date && new Date(`${month}/${day}/${year} ${time}`);
}

function _parsePolicyDate(policyName, key) {
  let out = new Date(policyName.replace(`${key}_`, '').replaceAll('_', '-'));
  return out;
}

export default {
  namespaced: true,
  getters: {
    // getPolicies takes an object of accepted policies from the user.
    // returns an object with all the policies, and when the user has
    // last signed them.
    getPolicies() {
      return acceptedPolicies => {
        const sortedPolicies = {};
        sortBy(Object.keys(acceptedPolicies), key =>
          _parsePolicyDate(
            key,
            key
              .split('_')
              .slice(-3)
              .join('_')
          )
        )
          .reverse()
          .forEach(key => {
            sortedPolicies[key] = acceptedPolicies[key];
          });
        return transform(
          policyDates,
          (result, latest, key) => {
            const lastPolicyKey = findKey(sortedPolicies, (v, k) => k.startsWith(key));
            const lastPolicy = sortedPolicies[lastPolicyKey];

            result[key] = {
              latest,
              signedOn: (lastPolicy && _parseDateFormat(lastPolicy)) || null,
              lastSignedPolicy: (lastPolicyKey && _parsePolicyDate(lastPolicyKey, key)) || null,
            };
          },
          {}
        );
      };
    },
    getPolicyAcceptedData() {
      return policyName => {
        // what should the format be?
        // {policy_name}_{year}_{month}_{day}
        // Get current date string
        const date = new Date();
        // this data is what we send to the server,
        // and converting it to a string makes it lose
        // timezone data. Ensure that we standardize on
        // UTC before sending that to the server.
        // part of the fix for issue #2508 and #2317.
        const day = ('0' + date.getUTCDate()).slice(-2);
        const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
        const year = String(date.getUTCFullYear()).slice(-2);
        const hour = ('0' + (date.getUTCHours() + 1)).slice(-2);
        const minute = ('0' + (date.getUTCMinutes() + 1)).slice(-2);
        const dateStr = `${day}/${month}/${year} ${hour}:${minute}`;

        // Get policy string
        const policyDate = policyDates[policyName];
        const policyYear = policyDate.getUTCFullYear();
        const policyMonth = policyDate.getUTCMonth() + 1;
        const policyDay = policyDate.getUTCDate();
        const policyStr = `${policyName}_${policyYear}_${policyMonth}_${policyDay}`;
        return { [policyStr]: dateStr };
      };
    },
    // returns a list of policy constants (e.g. policies.PRIVACY)
    // that have not been signed by the user.
    getNonAcceptedPolicies(state, getters) {
      return policies => {
        const policiesList = getters.getPolicies(policies);
        return Object.entries(policiesList)
          .map(([key, value]) => {
            // if they never signed anything, or the last thing
            // they signed isn't equal to the latest policy
            if (
              !value.lastSignedPolicy ||
              value.latest.getTime() != value.lastSignedPolicy.getTime()
            ) {
              return key;
            }
          })
          .filter(Boolean); // remove any undefined in the list
      };
    },
  },
  actions: {
    acceptPolicy(context, policy) {
      return client
        .post(window.Urls.policy_update(), { policy: JSON.stringify(policy) })
        .then(() => {
          window.user.policies = {
            ...(window.user.policies || {}),
            ...policy,
          };
        });
    },
  },
};
