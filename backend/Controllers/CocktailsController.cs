using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Entities;
using System.Text.Json;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CocktailsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public CocktailsController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // GET: /api/cocktails
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Cocktails>>> GetAllCocktails()
    {
        return await Task.FromResult(_context.Cocktails.ToList());
    }

    // GET: /api/cocktails/15346
    [HttpGet("{id}")]
    public async Task<ActionResult<Cocktails>> GetCocktailById(string id) // 👈 cambia da int a string
    {
        var cocktail = await _context.Cocktails.FindAsync(id);
        if (cocktail == null)
            return NotFound();

        return cocktail;
    }


    // POST: /api/cocktails/import (importa da file cocktails.json nella cartella wwwroot/data/)
    [HttpPost("import")]
    public async Task<IActionResult> ImportCocktails()
    {
        var filePath = Path.Combine(_env.WebRootPath ?? "wwwroot", "data", "cocktails.json");

        if (!System.IO.File.Exists(filePath))
            return NotFound("File JSON non trovato.");

        var json = await System.IO.File.ReadAllTextAsync(filePath);
        var jsonDoc = JsonDocument.Parse(json);
        var drinks = jsonDoc.RootElement.GetProperty("drinks");

        var cocktails = JsonSerializer.Deserialize<List<Cocktails>>(drinks.GetRawText());

        if (cocktails == null || !cocktails.Any())
            return BadRequest("Nessun cocktail trovato nel file.");

        _context.Cocktails.AddRange(cocktails);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Importati {cocktails.Count} cocktail nel database." });
    }
}
