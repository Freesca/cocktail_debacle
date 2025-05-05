using backend.Data;
using backend.DTOs.CocktailMeta;
using backend.DTOs.PlaceMeta;
using backend.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/reviews/metadata")]
public class ReviewMetadataController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ISortingService _sortingService;

    public ReviewMetadataController(AppDbContext db, ISortingService sortingService)
    {
        _db = db;
        _sortingService = sortingService;
    }

    [HttpGet("cocktail/{cocktailIdOrExternal}")]
    public async Task<IActionResult> GetMetadataCocktail( string cocktailIdOrExternal, [FromQuery] double lat, [FromQuery] double lng)
    {
        Cocktails? cocktail;

        cocktail = await _db.Cocktails.FirstOrDefaultAsync(c => c.IdDrink == cocktailIdOrExternal);

        if (cocktail == null)
            return NotFound("Cocktail not found");
        
        // Ottieni tutti i metadati
        var allResults = await _db.CocktailReviewMetadatas
            .Where(m => m.CocktailId == cocktail.IdDrink)
            .Include(m => m.Place)
            .Select(m => new CocktailMetaDto
            {
                PlaceId = m.PlaceId,
                GooglePlaceId = m.Place.GooglePlaceId,
                AverageScore = m.AverageScore,
                ReviewCount = m.ReviewCount
            })
            .ToListAsync();
        
        // Ordina i risultati tramite un servizio (placeholder per ora)
        var sorted = await _sortingService.SortByDistanceAsync(allResults, lat, lng);
        
        // Limita a massimo 20
        var top20 = sorted.Take(20);
        
        return Ok(top20);

    }

    [HttpGet("place/{placeIdOrGoogle}")]
    public async Task<IActionResult> GetMetadataPlace(string placeIdOrGoogle)
    {
        Place? place;

        // Se è un numero, trattalo come ID interno
        if (int.TryParse(placeIdOrGoogle, out var intId))
            place = await _db.Places.FirstOrDefaultAsync(p => p.Id == intId);
        else
            place = await _db.Places.FirstOrDefaultAsync(p => p.GooglePlaceId == placeIdOrGoogle);

        if (place == null)
            return NotFound("Place not found");

        var results = await _db.CocktailReviewMetadatas
            .Where(m => m.PlaceId == place.Id)
            .Include(m => m.Cocktail)
            .Select(m => new PlaceMetaDto
            {
                CocktailId = m.CocktailId,
                Name = m.Cocktail.StrDrink,
                AverageScore = m.AverageScore,
                ReviewCount = m.ReviewCount
            })
            .ToListAsync();

        return Ok(results);
    }

}

/*     private async Task<List<GooglePlaceResult>> GetNearbyPlacesFromGoogle(double lat, double lng, string apiKey, string? pageToken = null)
    {
        var allResults = new List<GooglePlaceResult>();
        var url = string.IsNullOrEmpty(pageToken)
            ? $"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&rankby=distance&keyword=cocktail+drink&key={apiKey}"
            : $"https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken={pageToken}&key={apiKey}";

        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            var responseString = await httpClient.GetStringAsync(url);
            int responseLength = responseString.Length;
            Console.WriteLine("Google API response received, length: {0}", responseLength);
            
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                NumberHandling = JsonNumberHandling.AllowReadingFromString
            };
            
            var response = JsonSerializer.Deserialize<GoogleNearbySearchResponse>(responseString, options);
            
            if (response?.Status != "OK" || response.Results == null)
            {
                string status = response?.Status ?? "null";
                Console.WriteLine("Invalid response status: {0}", status);
                return allResults;
            }

            int resultCount = response.Results.Count();
            Console.WriteLine("Successfully parsed {0} results from Google API", resultCount);
            allResults.AddRange(response.Results);

            // Check if we need to get more results
            if (!string.IsNullOrEmpty(response.NextPageToken) && allResults.Count() < 10)
            {
                // Google requires a delay before using the next_page_token
                await Task.Delay(2000);
                var nextPageResults = await GetNearbyPlacesFromGoogle(lat, lng, apiKey, response.NextPageToken);
                allResults.AddRange(nextPageResults);
            }

            return allResults;
        }
        catch (Exception ex)
        {
            // Log the error and return empty list
            string errorMessage = ex.Message;
            Console.WriteLine("Error getting nearby places: {0}", errorMessage);
            
            if (ex.InnerException != null)
            {
                string innerErrorMessage = ex.InnerException.Message;
                Console.WriteLine("Inner exception: {0}", innerErrorMessage);
            }
            
            return allResults;
        }
    }

    private class GoogleNearbySearchResponse
    {
        public List<GooglePlaceResult>? Results { get; set; }
        public string? NextPageToken { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    private class GooglePlaceResult
    {
        [JsonPropertyName("place_id")]
        public string place_id { get; set; } = string.Empty;
        
        [JsonPropertyName("name")]
        public string name { get; set; } = string.Empty;
        
        [JsonPropertyName("vicinity")]
        public string vicinity { get; set; } = string.Empty;
    }
 */

 /*     [Authorize]
    [HttpGet("cocktail/{cocktailIdOrExternal}")]
    public async Task<IActionResult> GetMetadataCocktail(string cocktailIdOrExternal)
    {
        Cocktail? cocktail = null;

        cocktail = await _db.Cocktail.FirstOrDefaultAsync(c => c.ExternalId == cocktailIdOrExternal);

        if (cocktail == null && int.TryParse(cocktailIdOrExternal, out var intId))  
            cocktail = await _db.Cocktail.FirstOrDefaultAsync(c => c.Id == intId);

        if (cocktail == null)
            return NotFound("Cocktail not found");

        var results = await _db.CocktailReviewMetadatas
            .Where(m => m.CocktailId == cocktail.Id)
            .Include(m => m.Place)
            .Select(m => new CocktailMetaDto
            {
                PlaceId = m.PlaceId,
                GooglePlaceId = m.Place.GooglePlaceId,
                AverageScore = m.AverageScore,
                ReviewCount = m.ReviewCount
            })
            .ToListAsync();

        return Ok(results);
    } */