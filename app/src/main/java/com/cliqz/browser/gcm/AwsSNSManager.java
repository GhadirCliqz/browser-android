package com.cliqz.browser.gcm;

import android.content.Context;
import android.util.Log;

import com.amazonaws.auth.CognitoCachingCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.sns.AmazonSNSClient;
import com.amazonaws.services.sns.model.CreatePlatformEndpointRequest;
import com.amazonaws.services.sns.model.CreatePlatformEndpointResult;
import com.amazonaws.services.sns.model.GetEndpointAttributesRequest;
import com.amazonaws.services.sns.model.GetEndpointAttributesResult;
import com.amazonaws.services.sns.model.NotFoundException;
import com.amazonaws.services.sns.model.SetEndpointAttributesRequest;
import com.cliqz.browser.BuildConfig;

import java.security.InvalidParameterException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import acr.browser.lightning.preference.PreferenceManager;

/**
 * @author Stefano Pacifici
 * @date 2016/03/01
 */
class AwsSNSManager {

    private final static String TAG = AwsSNSManager.class.getSimpleName();

    private final AmazonSNSClient client;
    private final PreferenceManager preferenceManager;

    public AwsSNSManager(PreferenceManager preferenceManager, Context context) {
        this.preferenceManager = preferenceManager;
        final CognitoCachingCredentialsProvider credentialsProvider =
                new CognitoCachingCredentialsProvider(context,
                        "141047255820",
                        "us-east-1:68bb8256-a533-4b93-b744-423518ef0f02",
                        "arn:aws:iam::141047255820:role/Cognito_CLIQZ_browser_androidUnauth_Role",
                        "arn:aws:iam::141047255820:role/Cognito_CLIQZ_browser_androidAuth_Role",
                        Regions.US_EAST_1);
        this.client = new AmazonSNSClient(credentialsProvider);
    }

    public void registerWithSNS(final String token) {

        String endpointArn = retrieveEndpointArn();

        boolean updateNeeded = false;
        boolean createNeeded = (null == endpointArn);

        if (createNeeded) {
            // No platform endpoint ARN is stored; need to call createEndpoint.
            endpointArn = createEndpoint(token);
            createNeeded = false;
        }

        Log.i(TAG, "Retrieving platform endpoint data...");
        // Look up the platform endpoint and make sure the data in it is current, even if
        // it was just created.
        try {
            GetEndpointAttributesRequest geaReq =
                    new GetEndpointAttributesRequest()
                            .withEndpointArn(endpointArn);
            GetEndpointAttributesResult geaRes =
                    client.getEndpointAttributes(geaReq);

            updateNeeded = !geaRes.getAttributes().get("Token").equals(token)
                    || !geaRes.getAttributes().get("Enabled").equalsIgnoreCase("true");

        } catch (NotFoundException nfe) {
            // We had a stored ARN, but the platform endpoint associated with it
            // disappeared. Recreate it.
            createNeeded = true;
        }

        if (createNeeded) {
            createEndpoint(token);
        }

        Log.i(TAG, "updateNeeded = " + updateNeeded);

        if (updateNeeded) {
            // The platform endpoint is out of sync with the current data;
            // update the token and enable it.
            Log.i(TAG, "Updating platform endpoint " + endpointArn);
            Map<String, String> attribs = new HashMap<>();
            attribs.put("Token", token);
            attribs.put("Enabled", "true");
            SetEndpointAttributesRequest saeReq =
                    new SetEndpointAttributesRequest()
                            .withEndpointArn(endpointArn)
                            .withAttributes(attribs);
            client.setEndpointAttributes(saeReq);
        }
    }

    /**
     * @return never null
     * */
    private String createEndpoint(final String token) {
        String endpointArn = null;
        try {
            Log.i(TAG, "Creating platform endpoint with token " + token);
            CreatePlatformEndpointRequest cpeReq =
                    new CreatePlatformEndpointRequest()
                            .withPlatformApplicationArn(BuildConfig.APPLICATION_ARN)
                            .withToken(token);
            CreatePlatformEndpointResult cpeRes = client
                    .createPlatformEndpoint(cpeReq);
            endpointArn = cpeRes.getEndpointArn();
        } catch (InvalidParameterException ipe) {
            String message = ipe.getMessage();
            Log.i(TAG, "Exception message: " + message);
            Pattern p = Pattern
                    .compile(".*Endpoint (arn:aws:sns[^ ]+) already exists " +
                            "with the same token.*");
            Matcher m = p.matcher(message);
            if (m.matches()) {
                // The platform endpoint already exists for this token, but with
                // additional custom data that
                // createEndpoint doesn't want to overwrite. Just use the
                // existing platform endpoint.
                endpointArn = m.group(1);
            } else {
                // Rethrow the exception, the input is actually bad.
                throw ipe;
            }
        }
        storeEndpointArn(endpointArn);
        return endpointArn;
    }

    /**
     * @return the ARN the app was registered under previously, or null if no
     *         platform endpoint ARN is stored.
     */
    private String retrieveEndpointArn() {
        final String arn = preferenceManager.getARNEndpoint();
        return arn;
    }

    /**
     * Stores the platform endpoint ARN in permanent storage for lookup next time.
     * */
    private void storeEndpointArn(String endpointArn) {
        preferenceManager.setARNEndpoint(endpointArn);
    }
}