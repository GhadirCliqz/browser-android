package com.cliqz.browser.antiphishing;

import android.support.annotation.NonNull;
import android.util.Log;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * @author Stefano Pacifici
 * @date 2016/07/11
 */
final class AntiPhishingUtils {

    private static final String TAG = AntiPhishingUtils.class.getSimpleName();

    public static final int MD5_LENGTH = 32;
    public static final int HALF_MD5_LENGHT = MD5_LENGTH / 2;

    private AntiPhishingUtils() {}

    /**
     * Weakly md5 check (represented as 32 chars hex string). It checks only for not null and
     * length.
     *
     * @param md5 an hex string, representing the MD5 hash
     * @return true if the string seems to be an MD5 hash, false otherwise
     */
    static boolean checkMD5(String md5) {
        // Weak check on md5 string, we do not check if it is a valid hex string
        if (md5 == null || md5.length() != MD5_LENGTH) {
            Log.e(TAG, "Invalid md5 length");
            return false;
        }
        return true;
    }

    /**
     * Split an MD5 hash (represented as 32 chars hex string) in two
     *
     * @param md5 an hex string
     * @return An string array with two elements: the first if the 16 chars prefix, the second is
     * the 16 chars suffix
     */
    static @NonNull String[] splitMD5(@NonNull String md5) {
        final byte[] bytes = md5.getBytes();
        return new String[] {
            new String(bytes, 0, HALF_MD5_LENGHT),
            new String(bytes, HALF_MD5_LENGHT, HALF_MD5_LENGHT)
        };
    }

    /**
     * Given a message (a string) will compute the hex representation of its MD5 hash.
     *
     * @param message a non-null string
     * @return the hexadecimal string representation of the message md5 hash, or a string with 32
     * in the case we do not have the MD5 algorithm available thought the JVM.
     */
    static @NonNull  String calculateMD5(@NonNull String message) {
        try {
            final MessageDigest md = MessageDigest.getInstance("MD5");
            md.reset();
            final byte[] digest = md.digest(message.getBytes());
            final byte[] hexDigest = new byte[digest.length * 2];
            for (int i = 0; i < digest.length; i++) {
                final byte high = (byte) ((digest[i] & 0xf0) >> 4);
                final byte low = (byte) (digest[i] & 0x0f);
                final int hi = i * 2;
                hexDigest[hi] = (byte) (high < 0x0a ? 0x30 + high : 0x57 + high);
                hexDigest[hi + 1] = (byte) (low < 0x0a ? 0x30 + low : 0x57 + low);
            }
            return new String(hexDigest);
        } catch (NoSuchAlgorithmException e) {
            Log.e(TAG, "Can't find MD5 digest algorithm", e);
            return "00000000000000000000000000000000";
        }
    }
}
