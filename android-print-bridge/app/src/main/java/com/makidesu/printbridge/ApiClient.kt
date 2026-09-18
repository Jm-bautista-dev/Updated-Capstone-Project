package com.makidesu.printbridge

import android.util.Log
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class ApiClient(private var baseUrl: String) {

    companion object {
        private const val TAG = "MakiApiClient"
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }

    private val gson = Gson()
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .writeTimeout(8, TimeUnit.SECONDS)
        .build()

    fun updateBaseUrl(url: String) {
        this.baseUrl = url.trimEnd('/')
    }

    suspend fun registerBridge(request: PrintBridgeRegisterRequest): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val json = gson.toJson(request)
            val body = json.toRequestBody(JSON_MEDIA_TYPE)
            val req = Request.Builder()
                .url("$baseUrl/api/v1/pos/print-bridges/register")
                .addHeader("X-Bridge-UUID", request.bridgeUuid)
                .addHeader("Accept", "application/json")
                .post(body)
                .build()

            val response = httpClient.newCall(req).execute()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errBody = response.body?.string()
                Result.failure(Exception("Registration failed (${response.code}): $errBody"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendHeartbeat(request: PrintBridgeHeartbeatRequest): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val json = gson.toJson(request)
            val body = json.toRequestBody(JSON_MEDIA_TYPE)
            val req = Request.Builder()
                .url("$baseUrl/api/v1/pos/print-bridges/heartbeat")
                .addHeader("X-Bridge-UUID", request.bridgeUuid)
                .addHeader("Accept", "application/json")
                .post(body)
                .build()

            val response = httpClient.newCall(req).execute()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Heartbeat failed with code ${response.code}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchPendingJobs(bridgeUuid: String, branchId: Int): Result<List<RemotePrintJob>> = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder()
                .url("$baseUrl/api/v1/pos/print-jobs/pending?branch_id=$branchId")
                .addHeader("X-Bridge-UUID", bridgeUuid)
                .addHeader("Accept", "application/json")
                .get()
                .build()

            val response = httpClient.newCall(req).execute()
            val raw = response.body?.string() ?: ""

            if (response.isSuccessful) {
                val parsed = gson.fromJson(raw, PendingJobsResponse::class.java)
                Result.success(parsed.jobs ?: emptyList())
            } else {
                Result.failure(Exception("Fetch pending jobs failed (${response.code}): $raw"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun claimJob(bridgeUuid: String, jobUuid: String): Result<RemotePrintJob> = withContext(Dispatchers.IO) {
        try {
            val body = "{}".toRequestBody(JSON_MEDIA_TYPE)
            val req = Request.Builder()
                .url("$baseUrl/api/v1/pos/print-jobs/$jobUuid/claim")
                .addHeader("X-Bridge-UUID", bridgeUuid)
                .addHeader("Accept", "application/json")
                .post(body)
                .build()

            val response = httpClient.newCall(req).execute()
            val raw = response.body?.string() ?: ""

            if (response.isSuccessful) {
                val parsed = gson.fromJson(raw, ClaimJobResponse::class.java)
                if (parsed.printJob != null) {
                    Result.success(parsed.printJob)
                } else {
                    Result.failure(Exception("Claimed job was null in response"))
                }
            } else {
                Result.failure(Exception("Claim failed (${response.code}): $raw"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateJobStatus(bridgeUuid: String, jobUuid: String, status: String, errorMsg: String? = null): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val request = UpdateStatusRequest(status = status, error = errorMsg)
            val body = gson.toJson(request).toRequestBody(JSON_MEDIA_TYPE)
            val req = Request.Builder()
                .url("$baseUrl/api/v1/pos/print-jobs/$jobUuid/status")
                .addHeader("X-Bridge-UUID", bridgeUuid)
                .addHeader("Accept", "application/json")
                .post(body)
                .build()

            val response = httpClient.newCall(req).execute()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Status update failed (${response.code})"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
