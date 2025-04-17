using backend.Data;
using backend.DTOs.CocktailMeta;
using backend.DTOs.PlaceMeta;
using backend.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/reviews/metadata")]
public class ReviewMetadataController(AppDbContext db) : ControllerBase
{
    private readonly AppDbContext _db = db;

    [Authorize]
    [HttpGet("cocktail/{cocktailIdOrExternal}")]
    public async Task<IActionResult> GetMetadataCocktail(string cocktailIdOrExternal)
    {
        Cocktails? cocktail;

        cocktail = await _db.Cocktails.FirstOrDefaultAsync(c => c.IdDrink == cocktailIdOrExternal);

        if (cocktail == null)
            return NotFound("Cocktail not found");

        var results = await _db.CocktailReviewMetadatas
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

        return Ok(results);
    }

    [Authorize]
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
