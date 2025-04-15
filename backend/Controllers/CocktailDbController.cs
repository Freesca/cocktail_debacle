using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;

namespace backend.Controllers;

[ApiController]
[Route("api/cocktail")]
public class CocktailDbController : ControllerBase
{
    private readonly HttpClient _httpClient;

    public CocktailDbController(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchCocktail([FromQuery] string f)
    {
        if (string.IsNullOrWhiteSpace(f))
            return BadRequest("Parametro 'f' mancante o vuoto.");

        var response = await _httpClient.GetAsync($"https://www.thecocktaildb.com/api/json/v1/1/search.php?f={f}");

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, "Errore nella richiesta all'API TheCocktailDB");

        var content = await response.Content.ReadAsStringAsync();
        return Content(content, "application/json");
    }
}
