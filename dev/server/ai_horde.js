import SuperMap from "@thunder04/supermap"
import { readFileSync } from "fs"
import { join } from "path"
import fetch from "node-fetch"

/*
 * https://github.com/db0/AI-Horde/blob/main/CHANGELOG.md
 */

export const ModelGenerationInputStableSamplers = Object.freeze({
  k_lms: "k_lms",
  k_heun: "k_heun",
  k_euler: "k_euler",
  k_dpm_2: "k_dpm_2",
  k_dpm_2_a: "k_dpm_2_a",
  DDIM: "DDIM",
  PLMS: "PLMS",
  k_dpm_fast: "k_dpm_fast",
  k_dpm_adaptive: "k_dpm_adaptive",
  k_dpmpp_2s_a: "k_dpmpp_2s_a",
  k_dpmpp_2m: "k_dpmpp_2m",
  dpmsolver: "dpmsolver",
  k_dpmpp_sde: "k_dpmpp_sde"
})

export const SourceImageProcessingTypes = Object.freeze({
  img2img: "img2img",
  inpainting: "inpainting",
  outpainting: "outpainting"
})

export const ModelGenerationInputPostProcessingTypes = Object.freeze({
  GFPGAN: "GFPGAN",
  RealESRGAN_x4plus: "RealESRGAN_x4plus",
  RealESRGAN_x2plus: "RealESRGAN_x2plus",
  RealESRGAN_x4plus_anime_6B: "RealESRGAN_x4plus_anime_6B",
  NMKD_Siax: "NMKD_Siax",
  "4x_AnimeSharp": "4x_AnimeSharp",
  strip_background: "strip_background",
  CodeFormers: "CodeFormers"
})

export const ModelInterrogationFormTypes = Object.freeze({
  caption: "caption",
  interrogation: "interrogation",
  nsfw: "nsfw",
  GFPGAN: "GFPGAN",
  RealESRGAN_x4plus: "RealESRGAN_x4plus",
  RealESRGAN_x4plus_anime_6B: "RealESRGAN_x4plus_anime_6B",
  NMKD_Siax: "NMKD_Siax",
  "4x_AnimeSharp": "4x_AnimeSharp",
  CodeFormers: "CodeFormers",
  strip_background: "strip_background"
})

export const HordeAsyncRequestStates = Object.freeze({
  waiting: "waiting",
  processing: "processing",
  done: "done",
  faulted: "faulted",
  partial: "partial",
  cancelled: "cancelled"
})

export const ModelGenerationInputControlTypes = Object.freeze({
  canny: "canny",
  hed: "hed",
  depth: "depth",
  normal: "normal",
  openpose: "openpose",
  seg: "seg",
  scribble: "scribble",
  fakescribbles: "fakescribbles",
  hough: "hough"
})

export const ModelPayloadTextInversionsStable = Object.freeze({
  prompt: "prompt",
  negrpompt: "negprompt"
})

export class APIError extends Error {
  constructor(rawError, core_res, method = "GET", requestBody) {
    super()
    this.rawError = rawError
    this.status = core_res.status ?? 0
    this.method = method
    this.url = core_res.url ?? ""
    this.requestBody = requestBody
  }

  get name() {
    return this.rawError.message
  }
}

export class AIHorde {
  #default_token
  #cache_config
  #cache
  #api_route
  #client_agent
  constructor(options) {
    this.#default_token = options?.default_token
    this.#api_route = options?.api_route ?? "https://aihorde.net/api/v2"
    this.#cache_config = {
      users: options?.cache?.users ?? 0,
      generations_check: options?.cache?.generations_check ?? 0,
      generations_status: options?.cache?.generations_status ?? 0,
      interrogations_status: options?.cache?.interrogations_status ?? 0,
      models: options?.cache?.models ?? 0,
      modes: options?.cache?.modes ?? 0,
      news: options?.cache?.news ?? 0,
      performance: options?.cache?.performance ?? 0,
      workers: options?.cache?.workers ?? 0,
      teams: options?.cache?.teams ?? 0,
      sharedkeys: options?.cache?.sharedkeys ?? 0
    }
    if (
      Object.values(this.#cache_config).some(
        v => !Number.isSafeInteger(v) || v < 0
      )
    )
      throw new TypeError(
        "Every cache duration must be a positive safe integer"
      )
    this.#cache = {
      users: this.#cache_config.users
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.users
          })
        : undefined,
      generations_check: this.#cache_config.generations_check
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.generations_check
          })
        : undefined,
      generations_status: this.#cache_config.generations_status
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.generations_status
          })
        : undefined,
      interrogations_status: this.#cache_config.interrogations_status
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.interrogations_status
          })
        : undefined,
      models: this.#cache_config.models
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.models
          })
        : undefined,
      modes: this.#cache_config.modes
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.modes
          })
        : undefined,
      news: this.#cache_config.news
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.news
          })
        : undefined,
      performance: this.#cache_config.performance
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.performance
          })
        : undefined,
      workers: this.#cache_config.workers
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.workers
          })
        : undefined,
      teams: this.#cache_config.teams
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.teams
          })
        : undefined,
      sharedkeys: this.#cache_config.sharedkeys
        ? new SuperMap({
            intervalTime: options?.cache_interval ?? 1000,
            expireAfter: this.#cache_config.sharedkeys
          })
        : undefined
    }

    try {
      let pckg = JSON.parse(
        readFileSync(join(__dirname, "./package.json"), "utf-8")
      )
      this.#client_agent =
        options?.client_agent ??
        `${pckg.name}:${pckg.version}:${pckg.bugs?.slice(8)}`
      this.VERSION = pckg.version
    } catch {
      this.#client_agent =
        options?.client_agent ??
        `@zeldafan0225/ai_horde:Version_Unknown:github.com/ZeldaFan0225/ai_horde/issues`
      this.VERSION = "Unknown"
    }

    this.ratings = new AIHordeRatings({
      api_route:
        options?.ratings_api_route ?? "https://ratings.aihorde.net/api/v1",
      default_token: options?.default_token,
      client_agent: this.#client_agent
    })
  }

  /* GENERAL */

  #getToken(token) {
    return token || this.#default_token || "0000000000"
  }

  clearCache() {
    Object.values(this.#cache).forEach(m => m.clear())
  }

  get cache() {
    return this.#cache
  }

  parseAgent(agent) {
    const [name, version, link] = agent.split(":")
    return {
      name,
      version,
      link
    }
  }

  generateFieldsString(fields) {
    return fields?.join(",")
  }

  async #request(route, method, options) {
    const fields_string =
      options?.fields?.join(",") || options?.fields_string || ""
    const t = this.#getToken(options?.token)

    const headers = {
      "Client-Agent": this.#client_agent,
      "Content-Type": "application/json"
    }
    if (options?.token) headers["apikey"] = t
    if (fields_string) headers["X-Fields"] = fields_string

    const res = await fetch(`${this.#api_route}${route}`, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined
    })

    if (!res.status.toString().startsWith("2"))
      throw new APIError(await res.json(), res, method, options?.body)

    return { result: res, fields_string }
  }

  /* GET REQUESTS */

  /**
   * Lookup user details based on their API key.
   * This can be used to verify a user exists
   * @param options.token - The token of the user; If none given the default from the contructor is used
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns UserDetails - The user data of the requested user
   */
  async findUser(options) {
    const { result, fields_string } = await this.#request(
      "/find_user",
      "GET",
      options
    )

    const data = await result.json()
    if (this.#cache_config.users) {
      const data_with_id = data
      if ("id" in data_with_id)
        this.#cache.users?.set(data_with_id.id + fields_string, data)
    }
    return data
  }

  /**
   * Details and statistics about a specific user
   * @param id - The user ids to get
   * @param options.token - The token of the requesting user; Has to be Moderator, Admin or Reuqested users token
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns UserDetails - The user data of the requested user
   */
  async getUserDetails(id, options) {
    const fields_string = this.generateFieldsString(options?.fields)
    const token = this.#getToken(options?.token)
    const temp =
      !options?.force && this.#cache.users?.get(id.toString() + fields_string)
    if (temp) return temp
    const { result } = await this.#request(`/users/${id}`, "GET", {
      fields_string,
      token
    })

    const data = await result.json()
    if (this.#cache_config.users) {
      const data_with_id = data
      if ("id" in data_with_id)
        this.#cache.users?.set(data_with_id.id + fields_string, data)
    }
    return data
  }

  /**
   * Details of a worker Team
   * @param id - The teams id to get
   * @param options.token - The token of the requesting user
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns TeamDetailsStable - The team data
   */
  async getTeam(id, options) {
    const fields_string = options?.fields?.length
      ? options.fields.join(",")
      : ""
    const token = this.#getToken(options?.token)
    const temp = !options?.force && this.#cache.teams?.get(id + fields_string)
    if (temp) return temp

    const { result } = await this.#request(`/teams/${id}`, "GET", {
      token,
      fields_string
    })

    const data = await result.json()

    if (this.#cache_config.teams) {
      const data_with_id = data
      if ("id" in data_with_id)
        this.#cache.teams?.set(data_with_id.id + fields_string, data)
    }
    return data
  }

  /**
   * Details of a registered worker.
   * This can be used to verify a user exists
   * @param id - The id of the worker
   * @param options.token  - Moderator or API key of workers owner (gives more information if requesting user is owner or moderator)
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns worker details for the requested worker
   */
  async getWorkerDetails(id, options) {
    const fields_string = options?.fields?.length
      ? options.fields.join(",")
      : ""
    const token = this.#getToken(options?.token)
    const temp = !options?.force && this.#cache.workers?.get(id + fields_string)
    if (temp) return temp

    const { result } = await this.#request(`/workers/${id}`, "GET", {
      token,
      fields_string
    })

    const data = await result.json()
    if (this.#cache_config.workers) {
      const data_with_id = data
      if ("id" in data_with_id)
        this.#cache.workers?.set(data_with_id.id + fields_string, data)
    }
    return data
  }

  /**
   * Retrieve the status of an Asynchronous generation request without images
   * Use this method to check the status of a currently running asynchronous request without consuming bandwidth.
   * @param id - The id of the generation
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns RequestStatusCheck - The Check data of the Generation
   */
  async getImageGenerationCheck(id, options) {
    const fields_string = options?.fields?.length
      ? options.fields.join(",")
      : ""
    const temp =
      !options?.force && this.#cache.generations_check?.get(id + fields_string)
    if (temp) return temp

    const { result } = await this.#request(`/generate/check/${id}`, "GET", {
      fields_string
    })

    const data = await result.json()
    if (this.#cache_config.generations_check)
      this.#cache.generations_check?.set(id + fields_string, data)
    return data
  }

  /**
   * Retrieve the full status of an Asynchronous generation request
   * This method will include all already generated images in base64 encoded .webp files.
   * As such, you are requested to not retrieve this data often. Instead use the getGenerationCheck method first
   * This method is limited to 1 request per minute
   * @param id - The id of the generation
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns RequestStatusStable - The Status of the Generation
   */
  async getImageGenerationStatus(id, options) {
    const fields_string = options?.fields?.length
      ? options.fields.join(",")
      : ""
    const temp =
      !options?.force && this.#cache.generations_status?.get(id + fields_string)
    if (temp) return temp

    const { result } = await this.#request(`/generate/status/${id}`, "GET", {
      fields_string
    })

    const data = await result.json()
    if (this.#cache_config.generations_status)
      this.#cache.generations_status?.set(id + fields_string, data)
    return data
  }

  /**
   * This request will include all already generated texts.
   * @param id - The id of the generation
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns RequestStatusStable - The Status of the Generation
   */
  async getTextGenerationStatus(id, options) {
    const fields_string = options?.fields?.length
      ? options.fields.join(",")
      : ""
    const temp =
      !options?.force && this.#cache.generations_status?.get(id + fields_string)
    if (temp) return temp

    const { result } = await this.#request(
      `/generate/text/status/${id}`,
      "GET",
      { fields_string }
    )

    const data = await result.json()
    if (this.#cache_config.generations_status)
      this.#cache.generations_status?.set(id + fields_string, data)
    return data
  }

  /**
   * This request will include all already generated images.
   * As such, you are requested to not retrieve this endpoint often. Instead use the /check/ endpoint first
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns InterrogationStatus - The Status data of the Interrogation
   */
  async getInterrogationStatus(id, options) {
    const fields_string = options?.fields?.length
      ? options.fields.join(",")
      : ""
    const temp =
      !options?.force &&
      this.#cache.interrogations_status?.get(id + fields_string)
    if (temp) return temp

    const { result } = await this.#request(`/interrogate/status/${id}`, "GET", {
      fields_string
    })

    const data = await result.json()
    if (this.#cache_config.interrogations_status)
      this.#cache.interrogations_status?.set(id + fields_string, data)
    return data
  }

  /**
   * If this loads, this node is available
   * @returns true - If request was successful, if not throws error
   */
  async getHeartbeat() {
    await this.#request(`/status/heartbeat`, "GET")

    return true
  }

  /**
   * Returns a list of models active currently in this horde
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns ActiveModel[] - Array of Active Models
   */
  async getModels(options) {
    const fields_string = options?.fields?.length
      ? options.fields.join(",")
      : ""
    const temp =
      !options?.force && this.#cache.models?.get("CACHE-MODELS" + fields_string)
    if (temp) return temp

    const { result } = await this.#request(`/status/models`, "GET", {
      fields_string
    })

    const data = await result.json()
    if (this.#cache_config.models)
      this.#cache.models?.set("CACHE-MODELS" + fields_string, data)
    return data
  }

  /**
   * Returns the statistics of a specific model in this horde
   * @param model_name - The name of the model to fetch
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns ActiveModel - The active model
   */
  async getModel(model_name, options) {
    const { result } = await this.#request(
      `/status/models/${model_name}`,
      "GET",
      { fields: options?.fields }
    )

    const data = await result.json()
    return data
  }

  /**
   * Horde Maintenance Mode Status
   * Use this method to quicky determine if this horde is in maintenance, invite_only or raid mode
   * @param options.token - Requires Admin or Owner API key
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns HordeModes - The current modes of the horde
   */
  async getModes(options) {
    const fields_string = options?.fields?.length
      ? options.fields.join(",")
      : ""
    const token = this.#getToken(options?.token)
    const temp =
      !options?.force && this.#cache.modes?.get("CACHE-MODES" + fields_string)
    if (temp) return temp

    const { result } = await this.#request(`/status/modes`, "GET", {
      token,
      fields_string
    })

    const data = await result.json()
    if (this.#cache_config.modes)
      this.#cache.modes?.set("CACHE-MODES" + fields_string, data)
    return data
  }

  /**
   * Read the latest happenings on the horde
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns Newspiece[] - Array of all news articles
   */
  async getNews(options) {
    const fields_string = options?.fields?.length
      ? options.fields.join(",")
      : ""
    const temp =
      !options?.force && this.#cache.news?.get("CACHE-NEWS" + fields_string)
    if (temp) return temp

    const { result } = await this.#request(`/status/news`, "GET", {
      fields_string
    })

    const data = await result.json()
    if (this.#cache_config.news)
      this.#cache.news?.set("CACHE-NEWS" + fields_string, data)
    return data
  }

  /**
   * Details about the current performance of this Horde
   * @param options.force - Set to true to skip cache
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns HordePerformanceStable - The hordes current performance
   */
  async getPerformance(options) {
    const fields_string = options?.fields?.length
      ? options.fields.join(",")
      : ""
    const temp =
      !options?.force &&
      this.#cache.performance?.get("CACHE-PERFORMANCE" + fields_string)
    if (temp) return temp

    const { result } = await this.#request(`/status/performance`, "GET", {
      fields_string
    })

    const data = await result.json()
    if (this.#cache_config.performance)
      this.#cache.performance?.set("CACHE-PERFORMANCE" + fields_string, data)
    return data
  }

  /**
   * A List with the details and statistic of all registered users
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns UserDetails[] - An array of all users data
   */
  async getUsers(options) {
    const { result, fields_string } = await this.#request(`/users`, "GET", {
      fields: options?.fields
    })

    const data = await result.json()
    if (this.#cache_config.users)
      data.forEach(d => {
        const data_with_id = d
        if ("id" in data_with_id)
          this.#cache.users?.set(data_with_id.id + fields_string, d)
      })
    return data
  }

  /**
   * A List with the details of all registered and active workers
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns An array of all workers data
   */
  async getWorkers(options) {
    const { result, fields_string } = await this.#request(`/workers`, "GET", {
      fields: options?.fields
    })

    const data = await result.json()
    if (this.#cache_config.workers)
      data.forEach(d => {
        const data_with_id = data
        if ("id" in data_with_id)
          this.#cache.workers?.set(data_with_id.id + fields_string, d)
      })
    return data
  }

  /**
   * Details how many images were generated per model for the past day, month and total
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns ImageModelStats - The stats
   */
  async getImageModelStats(options) {
    const { result } = await this.#request("/stats/img/models", "GET", {
      fields: options?.fields
    })

    const data = await result.json()
    return data
  }

  /**
   * Details how many images have been generated in the past minux,hour,day,month and total
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns ImageTotalStats - The stats
   */
  async getImageTotalStats(options) {
    const { result } = await this.#request("/stats/img/totals", "GET", {
      fields: options?.fields
    })

    const data = await result.json()
    return data
  }

  /**
   * Details how many texts were generated per model for the past day, month and total
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns TextModelStats - The stats
   */
  async getTextModelStats(options) {
    const { result } = await this.#request("/stats/text/models", "GET", {
      fields: options?.fields
    })

    const data = await result.json()
    return data
  }

  /**
   * Details how many images have been generated in the past minux,hour,day,month and total
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns TextTotalStats - The stats
   */
  async getTextTotalStats(options) {
    const { result } = await this.#request("/stats/text/totals", "GET", {
      fields: options?.fields
    })

    const data = await result.json()
    return data
  }

  /**
   * A List with the details of all teams
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns TeamDetailsStable[] - Array of Team Details
   */
  async getTeams(options) {
    const { result, fields_string } = await this.#request(`/teams`, "GET", {
      fields: options?.fields
    })

    const data = await result.json()
    if (this.#cache_config.teams)
      data.forEach(d => {
        const data_with_id = d
        if ("id" in data_with_id)
          this.#cache.teams?.set(data_with_id.id + fields_string, d)
      })
    return data
  }

  /**
   * A List of filters
   * @param query.filter_type - The type of filter to show
   * @param query.contains - Only return filter containing this word
   * @param options.token - The sending users API key; User must be a moderator
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns FilterDetails[] - Array of Filter Details
   */
  async getFilters(query, options) {
    const token = this.#getToken(options?.token)
    const params = new URLSearchParams()
    if (query?.filter_type) params.set("filter_type", query?.filter_type)
    if (query?.contains) params.set("contains", query?.contains)

    const { result } = await this.#request(
      `/filters${params.toString() ? `?${params.toString()}` : ""}`,
      "GET",
      { token, fields: options?.fields }
    )

    const data = await result.json()
    return data
  }

  /**
   * Gets Details for a specific filter
   * @param filter_id - The filter to show
   * @param options.token - The sending users API key; User must be a moderator
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns FilterDetails - Filter Details
   */
  async getFilter(filter_id, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/filters/${filter_id}`, "GET", {
      token,
      fields: options?.fields
    })

    const data = await result.json()
    return data
  }

  /**
   * Gets Details about an existing Shared Key for this user
   * @param sharedkey_id - The shared key to show
   * @param options.token - The sending users API key; User must be a moderator
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns FilterDetails - Filter Details
   */
  async getSharedKey(sharedkey_id, options) {
    const { result } = await this.#request(
      `/sharedkeys/${sharedkey_id}`,
      "GET",
      { fields: options?.fields }
    )

    const data = await result.json()
    return data
  }

  /* POST REQUESTS */

  /**
   * Transfer Kudos to a registered user
   * @param check_data - The prompt to check
   * @param options.token - The sending users API key; User must be a moderator
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns FilterPromptSuspicion
   */
  async postFilters(check_data, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/filters`, "POST", {
      token,
      fields: options?.fields,
      body: check_data
    })

    return await result.json()
  }

  /**
   * Initiate an Asynchronous request to generate images
   * This method will immediately return with the UUID of the request for generation.
   * This method will always be accepted, even if there are no workers available currently to fulfill this request.
   * Perhaps some will appear in the next 10 minutes.
   * Asynchronous requests live for 10 minutes before being considered stale and being deleted.
   * @param generation_data - The data to generate the image
   * @param options.token - The token of the requesting user
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns RequestAsync - The id and message for the async generation request
   */
  async postAsyncImageGenerate(generation_data, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/generate/async`, "POST", {
      token,
      fields: options?.fields,
      body: generation_data
    })

    return await result.json()
  }

  /**
   * Initiate an Asynchronous request to generate text
   * This endpoint will immediately return with the UUID of the request for generation.
   * This endpoint will always be accepted, even if there are no workers available currently to fulfill this request.
   * Perhaps some will appear in the next 20 minutes.
   * Asynchronous requests live for 20 minutes before being considered stale and being deleted.
   * @param generation_data - The data to generate the text
   * @param options.token - The token of the requesting user
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns RequestAsync - The id and message for the async generation request
   */
  async postAsyncTextGenerate(generation_data, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/generate/text/async`, "POST", {
      token,
      fields: options?.fields,
      body: generation_data
    })

    return await result.json()
  }

  /**
   * Submit aesthetic ratings for generated images to be used by LAION
   * The request has to have been sent as shared: true.
   * You can select the best image in the set, and/or provide a rating for each or some images in the set.
   * If you select best-of image, you will gain 4 kudos. Each rating is 5 kudos. Best-of will be ignored when ratings conflict with it.
   * You can never gain more kudos than you spent for this generation. Your reward at max will be your kudos consumption - 1.
   * @param generation_id - The ID of the generation to rate
   * @param rating - The data to rating data
   * @param options.token - The token of the requesting user
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns GenerationSubmitted - The kudos awarded for the rating
   */
  async postRating(generation_id, rating, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(
      `/generate/rate/${generation_id}`,
      "POST",
      { token, fields: options?.fields, body: rating }
    )

    return await result.json()
  }

  /**
   * Check if there are generation requests queued for fulfillment
   * This endpoint is used by registered workers only
   * @param pop_input
   * @param options.token - The token of the registered user
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns GenerationPayloadStable
   */
  async postImageGenerationPop(pop_input, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/generate/pop`, "POST", {
      token,
      fields: options?.fields,
      body: pop_input
    })

    return await result.json()
  }

  /**
   * Check if there are generation requests queued for fulfillment
   * This endpoint is used by registered workers only
   * @param pop_input
   * @param options.token - The token of the registered user
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns GenerationPayloadKobold
   */
  async postTextGenerationPop(pop_input, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/generate/text/pop`, "POST", {
      token,
      fields: options?.fields,
      body: pop_input
    })

    return await result.json()
  }

  /**
   * Submit a generated image
   * This endpoint is used by registered workers only
   * @param generation_submit
   * @param options.token - The workers owner API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns GenerationSubmitted
   */
  async postImageGenerationSubmit(generation_submit, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/generate/submit`, "POST", {
      token,
      fields: options?.fields,
      body: generation_submit
    })

    return await result.json()
  }

  /**
   * Submit generated text
   * This endpoint is used by registered workers only
   * @param generation_submit
   * @param options.token - The workers owner API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns GenerationSubmitted
   */
  async postTextGenerationSubmit(generation_submit, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/generate/text/submit`, "POST", {
      token,
      fields: options?.fields,
      body: generation_submit
    })

    return await result.json()
  }

  /**
   * Initiate an Asynchronous request to interrogate an image.
   * This endpoint will immediately return with the UUID of the request for interrogation.
   * This endpoint will always be accepted, even if there are no workers available currently to fulfill this request.
   * Perhaps some will appear in the next 20 minutes.
   * Asynchronous requests live for 20 minutes before being considered stale and being deleted.
   * @param interrogate_payload
   * @param options.token - The sending users API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns RequestInterrogationResponse
   */
  async postAsyncInterrogate(interrogate_payload, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/interrogate/async`, "POST", {
      token,
      fields: options?.fields,
      body: interrogate_payload
    })

    return await result.json()
  }

  /**
   * Check if there are interrogation requests queued for fulfillment
   * This endpoint is used by registered workers only
   * @param pop_input
   * @param options.token - The token of the registered user
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns InterrogationPopPayload
   */
  async postInterrogationPop(pop_input, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/interrogate/pop`, "POST", {
      token,
      fields: options?.fields,
      body: pop_input
    })

    return await result.json()
  }

  /**
   * Submit the results of an interrogated image
   * This endpoint is used by registered workers only
   * @param generation_submit
   * @param options.token - The workers owner API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns GenerationSubmitted
   */
  async postInterrogationSubmit(interrogation_submit, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/interrogate/submit`, "POST", {
      token,
      fields: options?.fields,
      body: interrogation_submit
    })

    return await result.json()
  }

  /**
   * Transfer Kudos to a registered user
   * @param transfer_data - The data specifiying who to send how many kudos
   * @param options.token - The sending users API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns KudosTransferred
   */
  async postKudosTransfer(transfer_data, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/kudos/transfer`, "POST", {
      token,
      fields: options?.fields,
      body: transfer_data
    })

    return await result.json()
  }

  /**
   * Receive kudos from the KoboldAI Horde
   * @param user_id - The stable horde user id of the receiving user
   * @param transfer_data - The data specifiying who to send how many kudos
   * @param options.token - The sending users API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns null
   */
  async postKoboldTransfer(user_id, transfer_data, options) {
    const token = this.#getToken(options?.token)

    await this.#request(`/kudos/kai/${user_id}`, "POST", {
      token,
      body: transfer_data
    })

    return null
  }

  /**
   * Create a new team
   * Only trusted users can create new teams.
   * @param create_payload - The data to create the team with
   * @param options.token - The API key of a trusted user
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns ModifyTeam
   */
  async createTeam(create_payload, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/teams`, "POST", {
      token,
      fields: options?.fields,
      body: create_payload
    })

    return await result.json()
  }

  /** PUT */

  /**
   * Change Horde Modes
   * @param modes - The new status of the Horde
   * @param options.token - Requires Admin API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns HordeModes
   */
  async putStatusModes(modes, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/status/modes`, "PUT", {
      token,
      fields: options?.fields,
      body: modes
    })

    return await result.json()
  }

  /**
   * Method for horde admins to perform operations on users
   * @param update_payload - The data to change on the target user
   * @param id - The targeted users ID
   * @param options.token - Requires Admin API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns ModifyUser
   */
  async updateUser(update_payload, id, options) {
    const token = this.#getToken(options?.token)

    const { result, fields_string } = await this.#request(
      `/users/${id}`,
      "PUT",
      { token, fields: options?.fields, body: update_payload }
    )

    if (this.#cache_config.users)
      this.#cache.users?.delete(id.toString() + fields_string)
    return await result.json()
  }

  /**
   * Put the worker into maintenance or pause mode
   * Maintenance can be set by the owner of the serve or an admin.
   * When in maintenance, the worker will receive a 503 request when trying to retrieve new requests. Use this to avoid disconnecting your worker in the middle of a generation
   * Paused can be set only by the admins of this Horde.
   * When in paused mode, the worker will not be given any requests to generate.
   * @param update_payload - The data to change on the target worker
   * @param id - The targeted workers ID
   * @param options.token - The worker owners API key or Admin API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns ModifyWorker
   */
  async updateWorker(update_payload, id, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/workers/${id}`, "PUT", {
      token,
      fields: options?.fields,
      body: update_payload
    })

    if (this.#cache_config.workers) this.#cache.workers?.delete(id)
    return await result.json()
  }

  /**
   * Adds a new regex filer
   * @param create_payload - The data to create the filter with
   * @param options.token - The Moderator API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns FilterDetails
   */
  async addFilter(create_payload, id, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/filters`, "PUT", {
      token,
      fields: options?.fields,
      body: create_payload
    })

    return await result.json()
  }

  /**
   * Create a new SharedKey for this user
   * @param create_payload - The data to create the shared key with
   * @param options.token - The User API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns SharedKeyInput
   */
  async putSharedKey(create_payload, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/sharedkeys`, "PUT", {
      token,
      fields: options?.fields,
      body: create_payload
    })

    return await result.json()
  }

  /** PATCH */

  /**
   * Updates a Team's information
   * @param update_payload - The data to update the team with
   * @param options.token - The Moderator or Creator API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns ModifyTeam
   */
  async updateTeam(update_payload, id, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/teams/${id}`, "PATCH", {
      token,
      fields: options?.fields,
      body: update_payload
    })

    if (this.#cache_config.teams) this.#cache.teams?.delete(id)
    return await result.json()
  }

  /**
   * Updates an existing regex filer
   * @param update_payload - The data to update the filter with
   * @param id - The ID of the filter
   * @param options.token - The Moderator API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns FilterDetails
   */
  async updateFilter(update_payload, id, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/filters/${id}`, "PATCH", {
      token,
      fields: options?.fields,
      body: update_payload
    })

    return await result.json()
  }

  /**
   * Modify an existing Shared Key
   * @param update_payload - The data to update the shared key with
   * @param id - The ID of the shared key
   * @param options.token - The User API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns SharedKeyDetails
   */
  async updateSharedKey(update_payload, id, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/sharedkeys/${id}`, "PATCH", {
      token,
      fields: options?.fields,
      body: update_payload
    })

    return await result.json()
  }

  /** DELETE */

  /**
   * Cancel an unfinished request
   * This request will include all already generated images in base64 encoded .webp files.
   * @param id - The targeted generations ID
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns RequestStatusStable
   */
  async deleteImageGenerationRequest(id, options) {
    const {
      result,
      fields_string
    } = await this.#request(`/generate/status/${id}`, "DELETE", {
      fields: options?.fields
    })

    const data = await result.json()
    if (this.#cache_config.generations_status)
      this.#cache.generations_status?.set(id + fields_string, data)
    return data
  }

  /**
   * Cancel an unfinished request
   * This request will include all already generated images in base64 encoded .webp files.
   * @param id - The targeted generations ID
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns RequestStatusKobold
   */
  async deleteTextGenerationRequest(id, options) {
    const {
      result,
      fields_string
    } = await this.#request(`/generate/text/status/${id}`, "DELETE", {
      fields: options?.fields
    })

    const data = await result.json()
    if (this.#cache_config.generations_status)
      this.#cache.generations_status?.set(id + fields_string, data)
    return data
  }

  /**
   * Cancel an unfinished interrogation request
   * This request will return all already interrogated image results.
   * @param id - The targeted generations ID
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns InterrogationStatus
   */
  async deleteInterrogationRequest(id, options) {
    const {
      result,
      fields_string
    } = await this.#request(`/interrogate/status/${id}`, "DELETE", {
      fields: options?.fields
    })

    const data = await result.json()
    if (this.#cache_config.interrogations_status)
      this.#cache.interrogations_status?.set(id + fields_string, data)
    return data
  }

  /**
   * Delete the worker entry
   * This will delete the worker and their statistics. Will not affect the kudos generated by that worker for their owner.
   * Only the worker's owner and an admin can use this endpoint.
   * This action is unrecoverable!
   * @param id - The targeted workers ID
   * @param options.token - The worker owners API key or a Moderators API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns DeletedWorker
   */
  async deleteWorker(id, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/workers/${id}`, "DELETE", {
      token,
      fields: options?.fields
    })

    const data = await result.json()
    this.#cache.workers?.delete(id)
    return data
  }

  /**
   * Delete an existing SharedKey for this user
   * @param id - The targeted Shared Key's ID
   * @param options.token - The worker owners API key or a Moderators API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns SimpleResponse
   */
  async deleteSharedKey(id, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/sharedkeys/${id}`, "DELETE", {
      token,
      fields: options?.fields
    })

    const data = await result.json()
    this.#cache.sharedkeys?.delete(id)
    return data
  }

  /**
   * Delete the team entry
   * Only the team's creator or a horde moderator can use this endpoint.
   * This action is unrecoverable!
   * @param id - The targeted teams ID
   * @param options.token - The worker owners API key or a Moderators API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns DeletedTeam
   */
  async deleteTeam(id, options) {
    const token = this.#getToken(options?.token)

    const { result, fields_string } = await this.#request(
      `/teams/${id}`,
      "DELETE",
      { token, fields: options?.fields }
    )

    const data = await result.json()
    this.#cache.teams?.delete(id + fields_string)
    return data
  }

  /**
   * Remove an IP from timeout
   * Only usable by horde moderators
   * @param ip - The IP address
   * @param options.token - Moderators API key
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns SimpleResponse
   */
  async deleteIPTimeout(delete_payload, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/operations/ipaddr`, "DELETE", {
      token,
      fields: options?.fields,
      body: delete_payload
    })

    const data = await result.json()
    return data
  }

  /**
   * Delete a regex filter
   * @param filter_id - The ID of the filter to delete
   * @param options.token - The sending users API key; User must be a moderator
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns SimpleResponse
   */
  async deleteFilter(filter_id, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/filters/${filter_id}`, "DELETE", {
      token,
      fields: options?.fields
    })

    const data = await result.json()
    return data
  }
}

/**
 * AI Horde Ratings
 */

export const RatingArtifactsRatings = Object.freeze({
  FLAWLESS: "FLAWLESS",
  LITTLE_FLAWS: "LITTLE_FLAWS",
  SOME_FLAWS: "SOME_FLAWS",
  OBVIOUS_FLAWS: "OBVIOUS_FLAWS",
  HARMFUL_FLAWS: "HARMFUL_FLAWS",
  GARBAGE: "GARBAGE"
})

export class AIHordeRatings {
  #default_token
  #api_route
  #client_agent
  constructor(options) {
    this.#default_token = options.default_token
    this.#api_route = options.api_route ?? "https://ratings.aihorde.net/api/v1"
    this.#client_agent = options.client_agent
  }

  #getToken(token) {
    return token || this.#default_token || "0000000000"
  }

  async #request(route, method, options) {
    const fields_string =
      options?.fields?.join(",") || options?.fields_string || ""
    const t = this.#getToken(options?.token)

    const headers = {
      ...options?.additional_headers,
      "Client-Agent": this.#client_agent,
      "Content-Type": "application/json"
    }
    if (options?.token) headers["apikey"] = t
    if (fields_string) headers["X-Fields"] = fields_string

    const res = await fetch(`${this.#api_route}${route}`, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined
    })

    if (!res.status.toString().startsWith("2"))
      throw new APIError(await res.json(), res, method, options?.body)

    return { result: res, fields_string }
  }

  /**
   * Display all datasets
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns RatingsDatasetResponse - The datasets
   */
  async getDatasets(options) {
    const { result } = await this.#request(`/datasets`, "GET", {
      fields: options?.fields
    })

    const data = await result.json()
    return data
  }

  /**
   * Display all public teams
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns RatingsTeamsResponse - The datasets
   */
  async getTeams(options) {
    const { result } = await this.#request(`/teams`, "GET", {
      fields: options?.fields
    })

    const data = await result.json()
    return data
  }

  /**
   * Retrieve an image to rate from the default dataset
   * @param image_options.dataset_id - The ID of the dataset to get an image from
   * @param image_options.model_name - The model name to get an image from
   * @param options.token - The token of the requesting user
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns DatasetImagePopResponse - An images data to rate
   */
  async getNewRating(image_options, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(
      `/rating/new${
        image_options?.dataset_id
          ? `/${image_options.dataset_id}${
              image_options?.model_name ? `/${image_options.model_name}` : ""
            }`
          : ""
      }`,
      "GET",
      { token, fields: options?.fields }
    )

    const data = await result.json()
    return data
  }

  /** POST ENDPOINTS */

  /**
   * Check if there are interrogation requests queued for fulfillment
   * This endpoint is used by registered workers only
   * @param image_id - The ID if the Image you want to rate
   * @param rating
   * @param options.token - The token of the requesting user
   * @param options.fields - Array of fields that will be included in the returned data
   * @returns InterrogationPopPayload
   */
  async postRating(image_id, rating, options) {
    const token = this.#getToken(options?.token)

    const { result } = await this.#request(`/rating/${image_id}`, "POST", {
      token,
      fields: options?.fields,
      body: rating
    })

    return await result.json()
  }
}