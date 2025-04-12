using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;

namespace backend.Controllers;

[ApiController]
[Route("places")]
public class PlaceSearchController : ControllerBase
{
    private readonly HttpClient _httpClient;

    public PlaceSearchController(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchPlaces([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest("Query is required.");

        // Estendi la query con cocktail e drink
        var enrichedQuery = $"{query} cocktail OR drink";

        var apiKey = Environment.GetEnvironmentVariable("GOOGLE_MAPS_API_KEY");
        if (string.IsNullOrEmpty(apiKey))
            return StatusCode(500, "API key not configured on server.");

        var url = $"https://maps.googleapis.com/maps/api/place/textsearch/json" +
                  $"?query={Uri.EscapeDataString(enrichedQuery)}&key={apiKey}";

        try
        {
            var response = await _httpClient.GetStringAsync(url);
            return Content(response, "application/json");
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(500, $"Google API request failed: {ex.Message}");
        }
    }
}
